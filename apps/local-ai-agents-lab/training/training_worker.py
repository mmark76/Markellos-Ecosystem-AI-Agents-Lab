"""Isolated worker: local pretrained model + JSONL data, never remote downloads."""
from __future__ import annotations

import json
import sys
from pathlib import Path

# Keep the worker directly executable on an isolated host and importable by
# repository tests without installing this developer-only directory as a package.
TRAINING_DIR = Path(__file__).resolve().parent
if str(TRAINING_DIR) not in sys.path:
    sys.path.insert(0, str(TRAINING_DIR))
from job_contract import JobContractError, normalize_job


def status(path, state, message, **more):
    path.write_text(json.dumps({"state": state, "message": message, **more}), encoding="utf-8")


def main(config_path):
    raw = json.loads(Path(config_path).read_text(encoding="utf-8"))
    path = Path(raw["statusPath"]) if isinstance(raw, dict) and isinstance(raw.get("statusPath"), str) and raw["statusPath"] else None
    config = None
    try:
        config = normalize_job(raw)
        path = Path(config["statusPath"])
        import torch
        from datasets import Dataset
        from peft import LoraConfig, TaskType
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from trl import SFTConfig, SFTTrainer

        if config["device"] == "cuda" and not torch.cuda.is_available():
            raise RuntimeError("CUDA was selected but is unavailable in the isolated environment.")
        device = "cuda" if config["device"] == "cuda" or (
            config["device"] == "auto" and torch.cuda.is_available()
        ) else "cpu"
        records = [json.loads(line) for line in Path(config["datasetPath"]).read_text(encoding="utf-8").splitlines() if line.strip()]
        if not records or any(not isinstance(record, dict) or not isinstance(record.get("text"), str) or not record["text"].strip() for record in records):
            raise RuntimeError("Dataset requires at least one non-empty text record.")
        status(path, "running", "Loading local model and dataset.", jobId=config["jobId"], device=device, progress=0)

        tokenizer = AutoTokenizer.from_pretrained(config["modelPath"], local_files_only=True)
        tokenizer.pad_token = tokenizer.pad_token or tokenizer.eos_token
        model = AutoModelForCausalLM.from_pretrained(config["modelPath"], local_files_only=True)
        peft_config = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            r=8,
            lora_alpha=16,
            lora_dropout=0.05,
            target_modules="all-linear",
        )
        args = SFTConfig(
            output_dir=config["outputPath"],
            num_train_epochs=config["epochs"],
            per_device_train_batch_size=config["batchSize"],
            logging_steps=1,
            save_strategy="epoch",
            report_to=[],
            use_cpu=device == "cpu",
            dataset_text_field="text",
            max_length=config["maxLength"],
        )
        trainer = SFTTrainer(
            model=model,
            args=args,
            train_dataset=Dataset.from_list(records),
            processing_class=tokenizer,
            peft_config=peft_config,
        )
        status(path, "running", "Supervised LoRA adapter training.", jobId=config["jobId"], device=device, progress=10)
        trainer.train()
        adapter = Path(config["outputPath"]) / "adapter"
        trainer.model.save_pretrained(adapter)
        tokenizer.save_pretrained(adapter)
        if not (adapter / "adapter_config.json").is_file():
            raise RuntimeError("Saved LoRA adapter is missing adapter_config.json.")
        status(path, "completed", "LoRA adapter saved successfully.", jobId=config["jobId"], device=device, progress=100, adapter=str(adapter))
        return 0
    except Exception as err:
        if path is not None:
            status(path, "failed", f"Training failed safely: {err}", jobId=config["jobId"] if config else raw.get("jobId", "unknown"))
        return 1


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1]))
    except (OSError, ValueError, JobContractError) as err:
        raise SystemExit(f"Training worker configuration failed: {err}")
