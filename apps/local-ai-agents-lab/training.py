"""Optional local training orchestration; ML packages remain isolated in training/.venv."""
from __future__ import annotations
import json, os, subprocess, time, uuid
from pathlib import Path
from threading import Lock

class TrainingError(ValueError): pass
class TrainingLockedError(TrainingError): pass

# This release intentionally has no activation switch. Phase 2 requires a
# separately approved design and verification before this may become true.
FINE_TUNING_ENABLED = False
FINE_TUNING_LOCK_MESSAGE = 'Fine-tuning is locked in this release and cannot be started.'

class TrainingService:
    def __init__(self, root: Path):
        self.root=root; self.datasets=root/'training-data'; self.models=root/'models'; self.outputs=root/'training-output'; self.runtime=root/'training'/'.venv'; self.jobs={}; self.process=None; self.lock=Lock()
    @property
    def enabled(self): return FINE_TUNING_ENABLED
    def python(self): return self.runtime / ('Scripts/python.exe' if os.name=='nt' else 'bin/python')
    def directories(self):
        self.models.mkdir(parents=True, exist_ok=True); self.datasets.mkdir(parents=True, exist_ok=True)
        return {'models':str(self.models.resolve()),'datasets':str(self.datasets.resolve()),'openFolder':os.name=='nt'}
    def open_directory(self, name):
        directories={'models':self.models,'datasets':self.datasets}; directory=directories.get(name)
        if directory is None: raise TrainingError('Select a supported local training directory.')
        directory.mkdir(parents=True, exist_ok=True)
        if os.name!='nt': raise TrainingError('Opening folders from the Lab is available on Windows only.')
        try: os.startfile(str(directory.resolve()))
        except OSError as err: raise TrainingError(f'Could not open the local folder: {err}') from err
        return {'directory':name,'path':str(directory.resolve())}
    def availability(self):
        result={'available':False,'enabled':self.enabled,'python':str(self.python()),'error':'Training environment is not installed.','torch':None,'cuda':{'available':False,'devices':[]}}
        if not self.enabled:
            result['error']=FINE_TUNING_LOCK_MESSAGE
            return result
        if not self.python().is_file(): return result
        code="import torch,json;print(json.dumps({'torch':torch.__version__,'cuda':torch.cuda.is_available(),'devices':[{'name':torch.cuda.get_device_name(i),'memoryMiB':round(torch.cuda.get_device_properties(i).total_memory/1048576)} for i in range(torch.cuda.device_count())] if torch.cuda.is_available() else []}))"
        try:
            probe=subprocess.run([str(self.python()),'-c',code],capture_output=True,text=True,timeout=10,check=True); data=json.loads(probe.stdout); result.update({'available':True,'error':'','torch':data['torch'],'cuda':{'available':data['cuda'],'devices':data['devices']}})
        except (OSError,subprocess.SubprocessError,json.JSONDecodeError) as err: result['error']=f'Training environment is unavailable: {err}'
        return result
    def datasets_list(self): self.datasets.mkdir(exist_ok=True); return sorted(p.name for p in self.datasets.glob('*.jsonl') if p.is_file())
    def models_list(self): self.models.mkdir(exist_ok=True); return sorted(p.name for p in self.models.iterdir() if p.is_dir())
    def validate_dataset(self,name):
        if name not in self.datasets_list(): raise TrainingError('Select a JSONL dataset from training-data.')
        rows=0
        for number,line in enumerate((self.datasets/name).read_text(encoding='utf-8').splitlines(),1):
            try: item=json.loads(line)
            except json.JSONDecodeError as err: raise TrainingError(f'Dataset line {number} is not valid JSON.') from err
            if not isinstance(item,dict) or not isinstance(item.get('text'),str) or not item['text'].strip() or len(item['text'])>24000: raise TrainingError(f'Dataset line {number} requires non-empty text up to 24,000 characters.')
            rows+=1
        if not rows: raise TrainingError('Dataset must contain at least one JSONL record.')
        return rows
    def config(self,raw):
        if not isinstance(raw,dict): raise TrainingError('Invalid training configuration.')
        dataset,model,method,device=(raw.get(k) for k in ('dataset','model','method','device'))
        if model not in self.models_list(): raise TrainingError('Select a local compatible model from models.')
        if method != 'lora' or device not in {'auto','cpu','cuda'}: raise TrainingError('Only the prepared LoRA adapter configuration is available for local training.')
        rows=self.validate_dataset(dataset); capability=self.availability()
        if not capability['available']: raise TrainingError(capability['error'])
        if device=='cuda' and not capability['cuda']['available']: raise TrainingError('CUDA GPU was selected, but PyTorch does not report a supported CUDA device.')
        return {'dataset':dataset,'model':model,'method':method,'device':device,'rows':rows}
    def start(self,raw):
        if not self.enabled: raise TrainingLockedError(FINE_TUNING_LOCK_MESSAGE)
        config=self.config(raw)
        with self.lock:
            if self.process and self.process.poll() is None: raise TrainingError('Another training job is already running.')
            job_id=uuid.uuid4().hex[:12]; directory=self.outputs/job_id; directory.mkdir(parents=True,exist_ok=False)
            config.update({'jobId':job_id,'modelPath':str(self.models/config['model']),'datasetPath':str(self.datasets/config['dataset']),'outputPath':str(directory),'statusPath':str(directory/'status.json')})
            (directory/'config.json').write_text(json.dumps(config,indent=2),encoding='utf-8'); (directory/'status.json').write_text(json.dumps({'state':'starting','message':'Waiting for isolated training runtime.'}),encoding='utf-8')
            self.process=subprocess.Popen([str(self.python()),str(self.root/'training'/'training_worker.py'),str(directory/'config.json')],cwd=self.root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); self.jobs[job_id]={'directory':directory,'startedAt':int(time.time())}
            return self.status(job_id)
    def status(self,job_id):
        if not job_id.isalnum() or job_id not in self.jobs: raise TrainingError('Unknown training job.')
        try: payload=json.loads((self.jobs[job_id]['directory']/'status.json').read_text(encoding='utf-8'))
        except (OSError,json.JSONDecodeError): payload={'state':'unknown','message':'Training status is unavailable.'}
        payload.update({'jobId':job_id,'output':str(self.jobs[job_id]['directory'].relative_to(self.root))}); return payload
    def stop(self,job_id):
        if job_id not in self.jobs: raise TrainingError('Unknown training job.')
        with self.lock:
            if self.process and self.process.poll() is None: self.process.terminate(); (self.jobs[job_id]['directory']/'status.json').write_text(json.dumps({'state':'stopping','message':'Stop requested; partial checkpoints are retained.'}),encoding='utf-8')
        return self.status(job_id)
