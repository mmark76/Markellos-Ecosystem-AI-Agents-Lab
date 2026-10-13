# Markellos Ecosystem AI Agents Lab

Version: v1.1.0 · Private local starter

Local Windows application with two workspaces:

- **Learning Lab:** Trainer → Student → Evaluator → Improver, one stage at a time.
- **AI Conference Room:** retained internally, but disabled in this release while collaboration is under construction.

The Learning Lab independently assigns installed **local Ollama** models to Trainer, Student, Evaluator, and Improver controls; the Conference Room keeps one selected Ollama model. The selected role models are snapshotted when a Training session starts, so changing a control affects the next session only. Each completed stage is saved before the next starts. The Lab requests `keep_alive: 0` after each completed stage so Ollama can release the model; this is best effort and can be checked with `ollama ps`. Slow CPU inference has no application-imposed deadline. They are not independently trained models: this cycle improves context and feedback, not model weights. Agents do not execute commands or access GitHub, repositories, or files. Feedback is not objective proof of improvement.

The **Learning Lab** uses the internal API id `training`. Existing local history is migrated to that identifier automatically. The **AI Conference Room** is not a verified user-available feature in this release.

> This is an experimental local lab, not an accredited educational institution.

## Easy Start for Windows

For a first-time setup, extract the ZIP and double-click **`Start AI Agents Lab.bat`**. Easy Start checks the computer, then starts the Lab when everything is ready.

It asks for a separate, explicit approval before it can:

1. Install Python 3.12 through Windows Package Manager (`winget`) if Python is missing.
2. Install Ollama through Windows Package Manager if Ollama is missing.
3. Start an already installed Ollama service when it is not running locally.
4. Download the initial local model, `qwen2.5:0.5b`, through the local Ollama service.

No package, service, or model download begins before its own approval dialog. Easy Start reuses compatible Python, Ollama, and local models already on the computer, and does not reinstall them. The first setup requires an Internet connection, Windows Package Manager, and at least 3 GiB of free disk space. Windows may show its own confirmation prompts for package installation.

## Inference engine

The Lab uses **only Ollama** at the fixed loopback address
`127.0.0.1:11434`. It never accepts an engine or provider URL from the UI or
API, and never falls back to a cloud service. The Lab shows only installed local
models returned by Ollama; if Ollama is not running, it displays a clear error.

## Add Model — Ollama (new local UI feature)

Expand **Add Model · Ollama**.
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

**Add Model** manages Ollama only. The installer is intentionally separate from
the PyTorch training wizard.

## Run the Lab on a laptop

1. Extract `AI-Agents-Lab-Windows.zip` into a folder you control, for example `C:\Markellos-Ecosystem-AI-Agents-Lab`.
2. Double-click **`Start AI Agents Lab.bat`**.
3. If Easy Start finds missing components, review each approval dialog. You can decline any step; the Lab will not start until its required local components are ready.
4. After setup, the Lab starts automatically at **http://127.0.0.1:8765/**.

Experienced users may run `start-windows.bat`; it performs the same readiness check before starting the server.

Stop the service with `Ctrl+C` in its PowerShell window. If port 8765 is
already in use, the application reports an error and does not replace another
service.

### Desktop shortcut

The first successful Easy Start run creates or refreshes a **Markellos Ecosystem
AI Agents Lab** shortcut on the current user's Desktop. It uses the
included AI Agents Lab icon and opens the extracted copy of the Lab. This
shortcut points to **`Start AI Agents Lab.bat`**, so it repeats the same safe
readiness check. Shortcut creation itself is local only and makes no network request.

The Lab folder is the folder where the user extracted
`AI-Agents-Lab-Windows.zip`; no separate or hidden installation folder is
created. After manually updating to a new extracted folder, run that folder's
`Start AI Agents Lab.bat` once so the shortcut points to the new copy.

## Updates

The Local Lab has no in-app update check. Visit the public dashboard to learn
when a newer `AI-Agents-Lab-Windows.zip` is available and download it manually.
To update, first stop the Lab, back up `data/campus.sqlite3`, extract the new
ZIP into a new folder, move the database only while both servers are stopped if
you want to keep the history, and start the new version. Keep the old folder
until the new installation works.

## Advanced model training — locked

Optional parameter fine-tuning is **not operational in this release** because
of a confirmed training-worker compatibility issue. The released Local App
locks this option and the normal Easy Start flow does not install training
packages, CUDA components, models, or datasets. Do not use the retained
developer-only training scripts until a future release explicitly verifies and
enables this feature.

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
- The application connects only to Ollama at its fixed loopback address. It has
  no cloud API keys, tracking, CDN, external library, or online inference feature.
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

This ZIP replaces earlier Local Starter ZIP packages. If you already
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
