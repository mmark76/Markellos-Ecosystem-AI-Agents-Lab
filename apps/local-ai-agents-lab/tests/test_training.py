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
CONTRACT_SPEC = importlib.util.spec_from_file_location('training_job_contract', Path(__file__).resolve().parents[1] / 'training' / 'job_contract.py')
job_contract = importlib.util.module_from_spec(CONTRACT_SPEC)
CONTRACT_SPEC.loader.exec_module(job_contract)
READINESS_SPEC = importlib.util.spec_from_file_location('training_readiness', Path(__file__).resolve().parents[1] / 'training' / 'readiness.py')
readiness = importlib.util.module_from_spec(READINESS_SPEC)
READINESS_SPEC.loader.exec_module(readiness)

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
            def save_pretrained(self, path):
                Path(path).mkdir(parents=True, exist_ok=True)
                (Path(path) / 'adapter_config.json').write_text('{}', encoding='utf-8')
                captured['model_saved_to'] = str(path)

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
                result = worker.main(config_path)

        self.assertEqual(captured['args']['max_length'], 512)
        self.assertEqual(captured['args']['dataset_text_field'], 'text')
        self.assertNotIn('max_seq_length', captured['args'])
        self.assertEqual(captured['records'], [{'text':'hello'}])
        self.assertEqual(captured['lora']['target_modules'], 'all-linear')
        self.assertIs(captured['trainer']['peft_config'], captured['lora'])
        self.assertNotIn('dataset_text_field', captured['trainer'])
        self.assertNotIn('max_seq_length', captured['trainer'])
        self.assertTrue(captured['trained'])
        self.assertEqual(result, 0)

    def test_worker_reports_failure_and_nonzero_status_for_missing_local_model(self):
        class FailingTokenizer:
            @staticmethod
            def from_pretrained(*args, **kwargs): raise OSError('model not found')
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); dataset = root / 'examples.jsonl'; dataset.write_text('{"text":"hello"}\n', encoding='utf-8')
            output = root / 'output'; output.mkdir(); status_path = root / 'status.json'; config_path = root / 'config.json'
            config_path.write_text(json.dumps({'device':'cpu','datasetPath':str(dataset),'modelPath':str(root / 'missing'),'outputPath':str(output),'statusPath':str(status_path)}), encoding='utf-8')
            fake_torch = types.SimpleNamespace(cuda=types.SimpleNamespace(is_available=lambda: False))
            fake_modules = {'torch':fake_torch, 'datasets':types.SimpleNamespace(Dataset=None), 'peft':types.SimpleNamespace(LoraConfig=None, TaskType=None), 'transformers':types.SimpleNamespace(AutoTokenizer=FailingTokenizer, AutoModelForCausalLM=None), 'trl':types.SimpleNamespace(SFTConfig=None, SFTTrainer=None)}
            with patch.dict(sys.modules, fake_modules): result = worker.main(config_path)
            payload = json.loads(status_path.read_text(encoding='utf-8'))
        self.assertEqual(result, 1); self.assertEqual(payload['state'], 'failed'); self.assertIn('model not found', payload['message'])

    def test_invalid_contract_writes_safe_failure_when_status_path_is_present(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); status_path = root / 'status.json'; config_path = root / 'config.json'
            config_path.write_text(json.dumps({'statusPath':str(status_path), 'method':'sft'}), encoding='utf-8')
            result = worker.main(config_path)
            payload = json.loads(status_path.read_text(encoding='utf-8'))
        self.assertEqual(result, 1); self.assertEqual(payload['state'], 'failed'); self.assertIn('requires a non-empty modelPath', payload['message'])


class RemoteReadinessTests(unittest.TestCase):
    def test_contract_rejects_full_parameter_method_and_invalid_limits(self):
        raw = {'modelPath':'model','datasetPath':'data.jsonl','outputPath':'output','statusPath':'status.json','method':'sft'}
        with self.assertRaisesRegex(job_contract.JobContractError, 'LoRA adapter'): job_contract.normalize_job(raw)
        raw['method'] = 'lora'; raw['maxLength'] = 4097
        with self.assertRaisesRegex(job_contract.JobContractError, 'maxLength'): job_contract.normalize_job(raw)

    def test_readiness_reports_mocked_cuda_host_as_ready(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); model = root / 'model'; model.mkdir(); (model / 'config.json').write_text('{}', encoding='utf-8')
            dataset = root / 'data.jsonl'; dataset.write_text('{"text":"synthetic"}\n', encoding='utf-8'); output = root / 'output'; output.mkdir()
            fake_torch = types.SimpleNamespace(__version__='2.7.1', cuda=types.SimpleNamespace(is_available=lambda: True, device_count=lambda: 1, get_device_name=lambda index: 'Mock NVIDIA', get_device_properties=lambda index: types.SimpleNamespace(total_memory=8 * 1024 * 1024 * 1024)))
            modules = {'torch':fake_torch, 'transformers':types.SimpleNamespace(__version__='4.53.0'), 'peft':types.SimpleNamespace(__version__='0.15.2'), 'trl':types.SimpleNamespace(__version__='0.19.1'), 'accelerate':types.SimpleNamespace(__version__='1.8.1'), 'datasets':types.SimpleNamespace(__version__='3.6.0')}
            with patch.object(readiness.importlib, 'import_module', side_effect=lambda name: modules[name]):
                report = readiness.readiness_report({'jobId':'gpu-smoke-1','modelPath':str(model),'datasetPath':str(dataset),'outputPath':str(output),'statusPath':str(root / 'status.json'),'method':'lora','device':'cuda'})
        self.assertEqual(report['state'], 'READY'); self.assertTrue(report['cuda']['available']); self.assertEqual(report['cuda']['devices'][0]['memoryMiB'], 8192)

    def test_readiness_reports_missing_packages_and_cuda_without_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); model = root / 'model'; model.mkdir(); (model / 'config.json').write_text('{}', encoding='utf-8')
            dataset = root / 'data.jsonl'; dataset.write_text('{"text":"synthetic"}\n', encoding='utf-8'); output = root / 'output'; output.mkdir()
            with patch.object(readiness.importlib, 'import_module', side_effect=ImportError):
                report = readiness.readiness_report({'modelPath':str(model),'datasetPath':str(dataset),'outputPath':str(output),'statusPath':str(root / 'status.json'),'device':'cuda'})
            self.assertFalse((root / 'status.json').exists())
        self.assertEqual(report['state'], 'NEEDS SETUP'); self.assertIn('CUDA was requested but is unavailable.', report['issues'])

    def test_readiness_reports_unreadable_host_as_not_verified(self):
        with patch.object(readiness.shutil, 'disk_usage', side_effect=OSError('mount unavailable')):
            report = readiness.readiness_report({'modelPath':'model','datasetPath':'data.jsonl','outputPath':'output','statusPath':'status.json'})
        self.assertEqual(report['state'], 'NOT VERIFIED'); self.assertIn('mount unavailable', report['error'])

if __name__ == '__main__': unittest.main()
