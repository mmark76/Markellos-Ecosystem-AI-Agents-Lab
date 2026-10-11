import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('training_service', Path(__file__).resolve().parents[1] / 'training.py')
training = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(training)

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
            config = self.service.config({'dataset':'valid.jsonl','model':'tiny-local','method':'sft','device':'cpu'})
        self.assertEqual(config['device'], 'cpu'); self.assertEqual(config['rows'], 1)

if __name__ == '__main__': unittest.main()
