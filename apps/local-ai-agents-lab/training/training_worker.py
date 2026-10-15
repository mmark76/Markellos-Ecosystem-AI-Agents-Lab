"""Isolated worker: local pretrained model + JSONL data, never remote downloads."""
from __future__ import annotations

import json
import sys
from pathlib import Path


def status(path, state, message, **more):
    path.write_text(json.dumps({"state": state, "message": message, **more}), encoding="utf-8")


def main(config_path):
    config = json.loads(Path(config_path).read_text(encoding="utf-8"))
    path = Path(config["statusPath"])
    try:
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
        records = [json.loads(line) for line in Path(config["datasetPath"]).read_text(encoding="utf-8").splitlines()]
        status(path, "running", "Loading local model and dataset.", device=device, progress=0)

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
            num_train_epochs=1,
            per_device_train_batch_size=1,
            logging_steps=1,
            save_strategy="epoch",
            report_to=[],
            use_cpu=device == "cpu",
            dataset_text_field="text",
            max_length=512,
        )
        trainer = SFTTrainer(
            model=model,
            args=args,
            train_dataset=Dataset.from_list(records),
            processing_class=tokenizer,
            peft_config=peft_config,
        )
        status(path, "running", "Supervised LoRA adapter training.", device=device, progress=10)
        trainer.train()
        adapter = Path(config["outputPath"]) / "adapter"
        trainer.model.save_pretrained(adapter)
        tokenizer.save_pretrained(adapter)
        status(path, "completed", "LoRA adapter saved successfully.", device=device, progress=100, adapter=str(adapter))
    except Exception as err:
        status(path, "failed", f"Training failed safely: {err}")


if __name__ == "__main__":
    main(sys.argv[1])
