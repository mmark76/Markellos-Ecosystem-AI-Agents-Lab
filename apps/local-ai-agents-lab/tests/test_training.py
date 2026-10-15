import importlib.util
import json
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('training_service', Path(__file__).resolve().parents[1] / 'training.py')
training = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(training)
WORKER_SPEC = importlib.util.spec_from_file_location('training_worker', Path(__file__).resolve().parents[1] / 'training' / 'training_worker.py')
worker = importlib.util.module_from_spec(WORKER_SPEC)
WORKER_SPEC.loader.exec_module(worker)

class TrainingServiceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.root = Path(self.tmp.name); self.service = training.TrainingService(self.root)
        (self.root/'models'/'tiny-local').mkdir(parents=True); (self.root/'training-data').mkdir()
        (self.root/'training-data'/'valid.jsonl').write_text('{"text":"hello"}\n', encoding='utf-8')
    def tearDown(self): self.tmp.cleanup()
    def test_validates_local_jsonl_and_rejects_paths(self):
        self.assertEqual(self.service.validate_dataset('valid.jsonl'), 1)
        with self.assertRaises(training.TrainingError): self.service.validate_dataset('../valid.jsonl')
        (self.root/'training-data'/'bad.jsonl').write_text('{"prompt":"missing text"}\n', encoding='utf-8')
        with self.assertRaises(training.TrainingError): self.service.validate_dataset('bad.jsonl')
    def test_cuda_does_not_fall_back_when_unavailable(self):
        with patch.object(self.service, 'availability', return_value={'available': True, 'cuda': {'available': False}}):
            with self.assertRaisesRegex(training.TrainingError, 'CUDA GPU'):
                self.service.config({'dataset':'valid.jsonl','model':'tiny-local','method':'lora','device':'cuda'})
    def test_cpu_configuration_is_separate_from_inference(self):
        with patch.object(self.service, 'availability', return_value={'available': True, 'cuda': {'available': False}}):
            config = self.service.config({'dataset':'valid.jsonl','model':'tiny-local','method':'lora','device':'cpu'})
        self.assertEqual(config['device'], 'cpu'); self.assertEqual(config['rows'], 1)
    def test_rejects_the_non_distinct_sft_label(self):
        with patch.object(self.service, 'availability', return_value={'available': True, 'cuda': {'available': False}}):
            with self.assertRaisesRegex(training.TrainingError, 'LoRA adapter'):
                self.service.config({'dataset':'valid.jsonl','model':'tiny-local','method':'sft','device':'cpu'})
    def test_lock_prevents_process_creation_and_keeps_diagnostics_read_only(self):
        with patch.object(training.subprocess, 'Popen') as popen, patch.object(training.subprocess, 'run') as run:
            with self.assertRaisesRegex(training.TrainingLockedError, 'locked'):
                self.service.start({'dataset':'valid.jsonl','model':'tiny-local','method':'lora','device':'cpu'})
            diagnostic = self.service.availability()
        popen.assert_not_called(); run.assert_not_called()
        self.assertFalse(diagnostic['enabled']); self.assertFalse(diagnostic['available'])
        self.assertIn('locked', diagnostic['error'])
        self.assertFalse(self.service.outputs.exists())
    def test_unavailable_training_dependencies_fail_safely_when_configuration_is_checked(self):
        with patch.object(self.service, 'availability', return_value={'available': False, 'cuda': {'available': False}, 'error': 'Training environment is not installed.'}):
            with self.assertRaisesRegex(training.TrainingError, 'not installed'):
                self.service.config({'dataset':'valid.jsonl','model':'tiny-local','method':'lora','device':'cpu'})
    def test_unavailable_local_model_fails_before_a_training_process_can_be_configured(self):
        with self.assertRaisesRegex(training.TrainingError, 'local compatible model'):
            self.service.config({'dataset':'valid.jsonl','model':'missing-local','method':'lora','device':'cpu'})
    def test_reports_resolved_local_input_directories(self):
        directories = self.service.directories()
        self.assertEqual(Path(directories['models']), (self.root / 'models').resolve())
        self.assertEqual(Path(directories['datasets']), (self.root / 'training-data').resolve())
        self.assertEqual(directories['openFolder'], os.name == 'nt')
    @unittest.skipUnless(os.name == 'nt', 'Windows-only folder opening')
    def test_opens_only_known_local_input_directories(self):
        with patch.object(training.os, 'startfile') as startfile:
            opened = self.service.open_directory('models')
        startfile.assert_called_once_with(str((self.root / 'models').resolve()))
        self.assertEqual(opened['path'], str((self.root / 'models').resolve()))
        with self.assertRaises(training.TrainingError): self.service.open_directory('../models')


class TrainingWorkerCompatibilityTests(unittest.TestCase):
    def test_worker_uses_the_pinned_trl_sft_config_contract_with_lora(self):
        captured = {}

        class FakeTokenizer:
            pad_token = None
            eos_token = '<eos>'
            def save_pretrained(self, path): captured['tokenizer_saved_to'] = str(path)

        class FakeModel:
            def save_pretrained(self, path): captured['model_saved_to'] = str(path)

        class FakeSFTConfig:
            def __init__(self, **kwargs): captured['args'] = kwargs

        class FakeSFTTrainer:
            def __init__(self, **kwargs):
                captured['trainer'] = kwargs
                self.model = kwargs['model']
            def train(self): captured['trained'] = True

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            dataset = root / 'examples.jsonl'; dataset.write_text('{"text":"hello"}\n', encoding='utf-8')
            output = root / 'output'; output.mkdir()
            config_path = root / 'config.json'
            config_path.write_text(json.dumps({'device':'cpu','datasetPath':str(dataset),'modelPath':str(root / 'model'),'outputPath':str(output),'statusPath':str(root / 'status.json')}), encoding='utf-8')
            fake_torch = types.SimpleNamespace(cuda=types.SimpleNamespace(is_available=lambda: False))
            fake_datasets = types.SimpleNamespace(Dataset=types.SimpleNamespace(from_list=lambda records: captured.setdefault('records', records)))
            fake_peft = types.SimpleNamespace(LoraConfig=lambda **kwargs: captured.setdefault('lora', kwargs), TaskType=types.SimpleNamespace(CAUSAL_LM='CAUSAL_LM'))
            fake_transformers = types.SimpleNamespace(AutoTokenizer=types.SimpleNamespace(from_pretrained=lambda *args, **kwargs: FakeTokenizer()), AutoModelForCausalLM=types.SimpleNamespace(from_pretrained=lambda *args, **kwargs: FakeModel()))
            fake_trl = types.SimpleNamespace(SFTConfig=FakeSFTConfig, SFTTrainer=FakeSFTTrainer)
            with patch.dict(sys.modules, {'torch':fake_torch, 'datasets':fake_datasets, 'peft':fake_peft, 'transformers':fake_transformers, 'trl':fake_trl}):
                worker.main(config_path)

        self.assertEqual(captured['args']['max_length'], 512)
        self.assertEqual(captured['args']['dataset_text_field'], 'text')
        self.assertNotIn('max_seq_length', captured['args'])
        self.assertEqual(captured['records'], [{'text':'hello'}])
        self.assertEqual(captured['lora']['target_modules'], 'all-linear')
        self.assertIs(captured['trainer']['peft_config'], captured['lora'])
        self.assertNotIn('dataset_text_field', captured['trainer'])
        self.assertNotIn('max_seq_length', captured['trainer'])
        self.assertTrue(captured['trained'])

if __name__ == '__main__': unittest.main()
