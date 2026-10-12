# Markellos Ecosystem AI Agents Lab — Private Local Starter (v0.1.7)

Local Windows application with two workspaces:

- **Learning Lab:** one Trainer and one Student agent.
- **AI Conference Room:** Architect, Developer, and Reviewer discuss a topic in sequence using the same history.

Both workspaces use the selected **local** Ollama, LM Studio, or vLLM model with different role instructions. They are not independently trained models. They do not execute commands or access GitHub, repositories, or files. Feedback is not objective proof of improvement.

The **Learning Lab** is the teaching room (internal API id: `university` for compatibility with the original version). The **AI Conference Room** keeps its existing behavior.

> This is an experimental local lab, not an accredited educational institution.

## Prerequisites

1. **Python 3.9 or later** for Windows, installed from python.org with the PATH option enabled.
2. **Ollama for Windows** from <https://ollama.com/download/windows>, or a locally running LM Studio or vLLM server.
3. A **local** model, for example with PowerShell: `ollama pull qwen3:4b`. It requires about 2.5 GB of disk space; suitability depends on available RAM, CPU, and GPU.

## Inference engines

The application exposes only three fixed local choices. It never accepts a
provider URL from the UI or API and never falls back to a cloud service.

| Engine | Local API | When to use it |
|---|---|---|
| **Ollama** (default) | `127.0.0.1:11434` | Simple local setup, model switching, and automatic model loading/unloading. |
| **LM Studio** | `127.0.0.1:1234/v1` | GUI-based local experimentation; start its local server first. |
| **vLLM** | `127.0.0.1:8000/v1` | High-throughput concurrent GPU inference on Linux, compatible WSL2, or a GPU server. |

The selected engine is checked only on its fixed loopback API and the Lab shows
only models returned by that API. If an engine is not running, the Lab displays
an error without affecting the other choices.

vLLM is not natively supported on Windows. RunPod or any other remote provider
requires separate remote-infrastructure approval and is not supported by this
release: all configured addresses remain `127.0.0.1`.

## Add Model — Ollama (new local UI feature)

When **Ollama** is the selected Inference Engine, expand **Add Model · Ollama**.
Enter an exact model name from the [Ollama model library](https://ollama.com/library),
for example `gemma3:4b`, then choose **Install model** and confirm the download.
Progress and errors appear in the Lab. After successful installation, the local
model selector refreshes and selects the downloaded model. Only one download can
run at a time; it may continue when the tab closes as long as the Lab stays running.

This is an explicit internet download by the local Ollama daemon to its own
model storage. **The Lab itself remains bound to loopback** and never receives
a remote provider URL, token, filesystem path, shell command, or cloud-inference
configuration. No packages or models are downloaded automatically. Check the
model's license, hardware requirements, network costs, and free disk space
before confirming: weights can consume many GB. Do not install cloud-hosted
models; the Lab filters them from local inference. If the model is unavailable
or the download fails, the error appears in the installer. Installation does
not train the model or install a compatible Transformers training directory.

LM Studio model downloads remain managed in the LM Studio application; vLLM
models are provisioned on the vLLM host. **Add Model** currently manages Ollama
only. The installer is intentionally separate from the PyTorch training wizard.

## Run the Lab on a laptop

1. Extract `AI-Agents-Lab-Windows.zip` into a folder you control, for example `C:\Markellos-Ecosystem-AI-Agents-Lab`.
2. Disable Ollama cloud capabilities as described below, restart Ollama, then run `ollama list` to confirm the installed local model. No sign-in is required.
3. Double-click `start-windows.bat`, or run `py -3 server.py` from PowerShell in the extracted folder.
4. Open **http://127.0.0.1:8765/** in a browser.
5. Choose a local model from the list and start a session.

Stop the service with `Ctrl+C` in its PowerShell window. If port 8765 is
already in use, the application reports an error and does not replace another
service.

### Desktop shortcut

The first run of `start-windows.bat` creates or refreshes a **Markellos AI
Agents University Lab** shortcut on the current user's Desktop. It uses the
included University Lab icon and opens the extracted copy of the Lab. This
shortcut creation is local only: it does not install Python, Ollama, PyTorch,
CUDA, models, drivers, or packages, and it makes no network request.

The Lab folder is the folder where the user extracted
`AI-Agents-Lab-Windows.zip`; no separate or hidden installation folder is
created. After manually updating to a new extracted folder, run that folder's
`start-windows.bat` once so the shortcut points to the new copy.

## Updates

The Local Lab has no in-app update check. Visit the public dashboard to learn
when a newer `AI-Agents-Lab-Windows.zip` is available and download it manually.
To update, first stop the Lab, back up `data/campus.sqlite3`, extract the new
ZIP into a new folder, move the database only while both servers are stopped if
you want to keep the history, and start the new version. Keep the old folder
until the new installation works.

## Model Training

The optional Training workspace performs real local parameter updates for a
compatible model using PEFT LoRA or TRL supervised fine-tuning. It is not an
agent exercise, inference request, or evaluation result. The standard Lab has
no ML dependencies: create `training/.venv`, install the pinned
`training/requirements.txt` there, and restart the Lab. No package, CUDA
toolkit, NVIDIA driver, model, or dataset is installed automatically.

Put an already downloaded compatible Transformers model directory below
`models/` and a selected JSONL file below `training-data/`. Each non-empty line
must be an object with a `text` string, for example `{"text":"User: Hello\nAssistant: Hello"}`.
Adapters, checkpoints, and status records are written only under
`training-output/`; these directories are excluded from Git. The server never
accepts paths, commands, model URLs, or remote datasets from the browser.

Compute choices are Auto (CUDA when PyTorch supports it, otherwise CPU), CPU,
and CUDA GPU. Explicit CUDA selection fails rather than falling back to CPU.
For a CUDA-capable build, install the PyTorch build appropriate to your Windows
driver and supported CUDA runtime using the official PyTorch selector, then
install the remaining pinned requirements in the same virtual environment.
CUDA is optional and no GPU, CUDA Toolkit, or driver is needed for the basic
Lab. A GPU out-of-memory failure leaves the job failed with retained partial
output; reduce model size or sequence length before retrying.

### Installation guide

The following is an **optional local installation** for training only. Do not
run it for the normal Ollama, LM Studio, or vLLM inference workflow.

**Guided path:** double-click
`setup-training-windows.bat`. The Windows Training Setup Wizard checks Python
3.11/3.12 and disk space, asks for CPU or NVIDIA CUDA, displays the exact CPU
libraries before download, asks for confirmation, creates `training\.venv`, and
runs a health check. It never downloads models/datasets, modifies inference,
installs drivers, or falls back from selected CUDA to CPU. CUDA setup opens the
official PyTorch selector because the matching wheel depends on the local
NVIDIA driver; the wizard verifies CUDA only after that explicit installation.

**Expert path:** use the commands below directly to
choose a specific supported Python, a corporate package mirror, or a PyTorch
CUDA build. Both paths use the same `training\.venv` and output folders.

1. Install a Python version supported by the pinned ML packages (use Python
   3.11 or 3.12 for this release). Python 3.14 is not compatible with the
   packaged `torch==2.7.1` requirement. Confirm the launcher can see it:

   ```powershell
   py -3.12 --version
   ```

2. Open PowerShell in the extracted `apps\local-ai-agents-lab` directory and
   create the isolated environment. This does not change the system Python:

   ```powershell
   py -3.12 -m venv training\.venv
   training\.venv\Scripts\python.exe -m pip install --upgrade pip
   ```

3. For **CPU training**, install the documented pinned packages:

   ```powershell
   training\.venv\Scripts\python.exe -m pip install -r training\requirements.txt
   ```

4. For **NVIDIA CUDA training**, first use the official [PyTorch installation
   selector](https://pytorch.org/get-started/locally/) to choose a Windows,
   Pip, Python, and CUDA build matching the installed NVIDIA driver. Install
   that `torch` command in `training\.venv`, then install the remaining
   packages from `requirements.txt`. Do not install drivers, a CUDA Toolkit,
   or a CUDA-enabled PyTorch build automatically from the Lab.

5. Verify the environment and hardware detection before starting the Lab:

   ```powershell
   training\.venv\Scripts\python.exe -c "import torch; print(torch.__version__); print('CUDA:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'none')"
   ```

6. Create these local directories beside `server.py` if they do not exist:

   ```text
   models\<your-compatible-local-transformers-model>\
   training-data\<dataset>.jsonl
   ```

   Model files must already be downloaded. The Lab intentionally uses
   `local_files_only=True`; it will not download models. Every JSONL line must
   be a small valid JSON object with one non-empty `text` field:

   ```json
   {"text":"User: Explain LoRA briefly.\nAssistant: LoRA fine-tunes small adapter matrices."}
   ```

7. Start the Lab, open `http://127.0.0.1:8765/`, then open **Model Training**.
   Select the model, JSONL dataset, LoRA or SFT, and
   Auto, CPU, or CUDA GPU. Review the shown configuration and confirm the
   explicit start prompt. Only one job can run at a time.

8. Read the status and output location in the Training workspace. Finished
   adapters and checkpoints remain under `training-output\<job-id>\`; keep
   these files local and back them up separately if needed. A stopped or failed
   job preserves partial output. An explicit CUDA selection never falls back to
   CPU—correct the PyTorch/CUDA installation or choose CPU intentionally.

### What is and is not installed

- Installed locally only in `training\.venv`: PyTorch, Transformers, PEFT,
  TRL, and their dependencies.
- Not included or automatically installed: CUDA drivers/Toolkit, models,
  datasets, adapters, checkpoints, or cloud credentials.
- The ZIP contains only the code and instructions for Training. The main
  application and Ollama, LM Studio, and vLLM continue to work without these
  libraries.

## Required Ollama configuration for fully local operation

Create or edit `%USERPROFILE%\.ollama\server.json` with:

```json
{
  "disable_ollama_cloud": true
}
```

Before replacing an existing file, preserve its other settings and add only the
`disable_ollama_cloud` field. Restart **Ollama**, not only this application.
According to Ollama documentation, this disables both cloud models and web
search. Alternatively, set `OLLAMA_NO_CLOUD=1` in the **Ollama process**
environment.

## Privacy and boundaries

- The web server binds **only** to `127.0.0.1:8765`.
- The application connects only to fixed loopback addresses for Ollama, LM
  Studio, and vLLM. It has no cloud API keys, tracking, CDN, external library,
  or online inference feature.
- Names containing `cloud` are filtered, but this is **not sufficient on its
  own**. For genuinely local Ollama operation, enable `disable_ollama_cloud`
  as described above and use downloaded local models only.
- `data/campus.sqlite3` is created automatically and stores conversations
  without encryption. Use BitLocker or Windows device encryption when
  protection at rest is required.
- Anyone who can access the **same Windows account or device** may be able to
  read that file.
- Internet access is required while downloading or installing Python, Ollama,
  and a model. The basic application does not require internet access after
  setup.
- The ChatGPT conversation you are using now is **not** a local service. Do
  not paste private application data into it unless you want it sent to a
  third-party service.
- Do not publish `data/` to GitHub. The `.gitignore` excludes the database.

## Backup

Stop the server first, then copy `data/campus.sqlite3` to a safe location.
SQLite keeps the two workspaces with separate histories.

## Technical notes

- Python standard library only: HTTP server, SQLite, and local provider HTTP APIs.
- The Lab does not install Python packages, services, scheduled tasks, Git
  hooks, or files outside the application folder.
- Experimental MVP; not a certified security or agent-evaluation system.

## Migration from the original ZIP

This ZIP replaces **AI-Agents-University-Local-Starter.zip**. If you already
ran the older version, stop its server first. `data/campus.sqlite3` is **not**
included in the ZIP and is not moved automatically. To keep previous
conversations, back up the existing database and put it in the corresponding
`data/` folder of the new application only while the server is stopped. Do not
delete the old folder until the new installation is verified.

On a laptop that already has Ollama and local Qwen models installed, another
`ollama pull` is not required if the desired model appears in `ollama list`.

## Automatic Build ID and controlled deployment

The version is defined in the `VERSION` file, for example `0.1.1`. The Build
ID is generated automatically from the version, the commit time in the
Europe/Nicosia time zone, and the first seven characters of the actual commit
SHA.

From the repository checkout, within `apps/local-ai-agents-lab`:

    node scripts/build-release.cjs HEAD C:\Temp\lab-release-new
    node scripts/verify-release.cjs C:\Temp\lab-release-new\local-ai-agents-lab FULL_SHA

The verifier checks `release.json` and the two Build ID markers in Info and
Footer. After a merge to `main`, GitHub Actions produces a verified
installation artifact for the commit.

For laptop installation: make a backup, stop the local application, copy only
the package files, restart, and verify. Preserve `data/` and local Ollama
models. Never type the Build ID manually during deployment. Laptop installation
requires separate approval and is never performed automatically by GitHub
Actions.
