# Markellos Ecosystem AI Lab

Version: v2.0.22 · Private local starter

Local Windows application with five active workspaces:

- **Conference Room:** Strategist → Analyst → Engineer.
- **Training Lab:** Tutor → Student → Evaluator → Improver.
- **Evaluation Lab:** Assessment → Scoring → Benchmarking.
- **Advisory Lab:** Analysis → Recommendations.
- **Optimization Lab:** Diagnose → Optimize → Validate.

Every active Lab independently assigns installed **local Ollama** models to its agents. Training selections are snapshotted when a session starts; legacy Trainer records remain readable as Tutor history. Each completed Training stage is saved before the next starts. The Lab requests `keep_alive: 0` after each completed stage so Ollama can release the model; this is best effort and can be checked with `ollama ps`. Slow CPU inference has no application-imposed deadline. These workflows improve context and feedback, not model weights. Agents do not execute commands or access GitHub, repositories, or files. Model judgments are not objective proof or independently verified measurements.

The **Training Lab** uses the internal API id `training`. Existing local history is migrated to that identifier automatically. Every Lab has separate local history and executes its approved roles sequentially.

> This is an experimental local lab, not an accredited educational institution.

## Easy Start for Windows

For a first-time setup, extract the ZIP and double-click **`Start AI Training Lab.bat`**. Easy Start checks the computer, then starts the Lab when everything is ready.

After the initial setup, start the Lab from its Desktop shortcut or the public dashboard's Launch Local Lab button. The dashboard also has **Refresh Local Server Before Launch**: it starts a clean local server without opening the app, so you can then choose Launch Local Lab. The browser may request confirmation before opening either installed local action.

It asks for a separate, explicit approval before it can:

1. Install Python 3.12 through Windows Package Manager (`winget`) if Python is missing.
2. Install Ollama through Windows Package Manager if Ollama is missing.
3. Start an already installed Ollama service when it is not running locally.
4. Download the initial local model, `qwen2.5:0.5b`, through the local Ollama service.

No package, service, or model download begins before its own approval dialog. Easy Start reuses compatible Python, Ollama, and local models already on the computer, and does not reinstall them. The first setup requires an Internet connection, Windows Package Manager, and at least 3 GiB of free disk space. Windows may show its own confirmation prompts for package installation.

## Bundled educational reference library

This Windows ZIP includes two documentation-only Markdown files in the
`docs/learning/` folder: `EDUCATIONAL_RESOURCE_LIBRARY.md` and
`STARTER_EXERCISES.md`. You can read them without downloading any external
datasets. These references are not connected to runtime Agent selection,
fine-tuning, benchmarking or executable dependencies.

## Agent system prompts

All fifteen Lab-scoped system prompts are independently maintained as UTF-8 text
files under `prompts/`. The local server loads them on startup; restart the Lab
to apply an edited prompt. The packaged Windows release includes every active
role prompt.

## Automatic Exercise Engine — future feature

The Training Lab displays **Unavailable - Under Construction** for its planned
automatic exercise selection feature. The runtime catalog in `exercise_library.py`
is deliberately **empty**: no active exercises, datasets or automated starts
are shipped. Training Topic is **required**; pressing Start uses only the
existing manual `POST /api/run` workflow (Tutor → Student → Evaluator → Improver).
The reserved `POST /api/auto-run` endpoint returns HTTP 503 for Training Lab
without creating a session; the other four Labs reject automatic requests.

The room-keyed selector, exercise formatting and additive nullable SQLite
`exercise_id` provenance field remain as inactive, reusable infrastructure.
There is no automatic selection, dataset import, model training, background
work or modification to the five Labs and fifteen system prompts. Existing
SQLite history remains readable.
See [Future Exercise Engine](../../docs/learning/AUTO_SELECTION.md).

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
model storage. **The Lab itself remains bound to loopback** and never accepts
a remote provider URL, filesystem path, shell command, or cloud-inference
configuration for Ollama. The separate Personal Provider control can retain a
user-supplied, Windows-DPAPI-protected RunPod token for an explicit account
connection check only; it is not an Ollama inference credential. No packages
or models are downloaded automatically. Check the
model's license, hardware requirements, network costs, and free disk space
before confirming: weights can consume many GB. Do not install cloud-hosted
models; the Lab filters them from local inference. If the model is unavailable
or the download fails, the error appears in the installer. Installation does
not train the model or install a compatible Transformers training directory.

**Add Model** manages Ollama only. The installer is intentionally separate from
the PyTorch training wizard.

## Run the Lab on a laptop

1. Extract `AI-Agents-Lab-Windows.zip` into a folder you control, for example `C:\Markellos-Ecosystem-AI-Agents-Lab`.
2. Double-click **`Start AI Training Lab.bat`**.
3. If Easy Start finds missing components, review each approval dialog. You can decline any step; the Lab will not start until its required local components are ready.
4. After setup, the Lab starts automatically at **http://127.0.0.1:8765/**.

Experienced users may run `start-windows.bat`; it performs the same readiness check before starting the server.

Stop the service with `Ctrl+C` in its PowerShell window. When starting
a freshly extracted ZIP, the Windows launcher first checks port `8765`. If a
running Python server is confirmed as AI Training Lab, it asks for permission
before stopping that exact process and starting the new copy. Older ZIPs used
a relative `server.py` command that cannot establish ownership conclusively;
the prompt discloses this uncertainty, the PID, and the command line. Declining
leaves the existing process untouched. An unrelated or unidentifiable listener
is never stopped automatically. Stopping a running Lab can interrupt active
agent work, so finish or save work before approving. Neither this step nor
the new ZIP deletes local SQLite histories or credentials.

Downloading a ZIP alone does not close a local server; the replacement check
occurs when the new extracted ZIP's `Start AI Training Lab.bat` is executed.
It does not change the existing fixed-loopback provider boundary.

The dashboard's **Refresh Local Server Before Launch** action uses that same
replacement check and starts the installed Lab copy without opening a browser
tab. It has no URL-supplied arguments and is registered only for the current
Windows user. If the existing listener is a verified Lab server, it still asks
before interrupting active work; an unrelated or unverified listener is left
untouched.

### Desktop shortcut

The first successful Easy Start run creates or refreshes a **Markellos Ecosystem
AI Lab** shortcut on the current user's Desktop. It uses the
included AI Lab icon and opens the extracted copy of the Lab. This
shortcut points to **`Start AI Training Lab.bat`**, so it repeats the same safe
readiness check. Shortcut creation itself is local only and makes no network request.

The Lab folder is the folder where the user extracted
`AI-Agents-Lab-Windows.zip`; no separate or hidden installation folder is
created. After manually updating to a new extracted folder, run that folder's
`Start AI Training Lab.bat` once so the shortcut points to the new copy.

## Updates

The Local Lab has no in-app update check. Visit the public dashboard to learn
when a newer `AI-Agents-Lab-Windows.zip` is available and download it manually.
To update, first stop the Lab, back up `data/campus.sqlite3`, extract the new
ZIP into a new folder, move the database only while both servers are stopped if
you want to keep the history, and start the new version. Keep the old folder
until the new installation works.

## Personal provider connection — active; remote training — locked

The Advanced **Personal Fine-Tuning Provider** area is active for a user to
set a personal spending/time plan in EUR or USD, store a RunPod token encrypted for their
current Windows account, and explicitly check that account's current GPU
availability and listed prices. The token stays on the user's computer until
the explicit check, which contacts only RunPod's fixed API. Markellos does not
hold a shared GPU account, wallet, payment method, or copy of the token.

The connection check is read-only: it cannot create a Pod, upload a model or
dataset, start training, or charge the provider account. Those actions need a
separate, reviewed remote-execution workflow with a final per-job cost and
data-transfer confirmation. The selected EUR/USD value is a personal planning
limit only. RunPod catalog prices remain in USD, and the Lab does not perform
an exchange-rate conversion or enforce a provider-side spending cap.

## Optional ChatGPT Advisor — one explicit question

The Connections panel also offers an optional **Connect with ChatGPT**
button. It is a browser-mediated account connection, not an OpenAI API-key
field. The Lab does not accept, store, or use OpenAI API keys. Before the first
connection, the user must separately approve installation of the pinned
identity-verification component in a virtual environment inside the extracted
Lab folder. It validates the OpenAI identity response and stores the resulting
connection record with Windows DPAPI for the current Windows user.

Connecting opens the user's browser for approval. It does not by itself send a
prompt or call a model. Once connected, the Advisor accepts one explicit
question and shows its completed answer below it. The Ask action is the
per-request consent: it sends only that question, not a room, pasted material,
notes, local history, files, or agent output. The Lab chooses the first visible
model in the account-specific provider catalog internally; it never exposes a
manual model picker or silently retries another model. The Advisor never reads
a room automatically, synchronizes history in the background, or adds an
external answer to local room history. After a completed Ask, the submitted
question and returned answer are saved in a separate local Advisor history in
`data/campus.sqlite3`. This local copy is not replayed to ChatGPT, synchronized
in the background, or deleted by disconnecting; the user can review and
explicitly clear it in the Advisor. While the connection is active the Lab is
not exclusively local; the user can disconnect at any time to restore local-only
operation.

The local agents continue to use loopback Ollama independently. Their work
remains local unless the user deliberately asks the external advisor a
question. Disconnect deletes the encrypted connection, dynamic client
registration, and local host profile; after disconnection the Lab has no
ChatGPT connection and returns to local-only operation.

## Advanced model training — locked

Optional parameter fine-tuning is **not operational in this release**. Phase 1
corrects the retained worker for the pinned TRL API and prepares supervised
LoRA adapter training only; it does not enable full-parameter fine-tuning. The
released Local App locks the API before it can create a training subprocess,
while retaining read-only diagnostics. The normal Easy Start flow does not
install training packages, CUDA components, models, or datasets. Do not use the
retained developer-only training scripts until a future release explicitly
verifies and enables this feature.

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
- The application connects only to Ollama at its fixed loopback address for
  local-agent inference. If the user connects and explicitly uses the External
  ChatGPT advisor, selected material is sent to OpenAI's fixed authorization,
  token, public-key, model-catalog, and Responses endpoints. Advisor requests
  use the connected ChatGPT account, `store: false`, and streaming; the Lab has
  no OpenAI API-key field, tracking, CDN, automatic conversation sync, or
  background cloud inference.
- Names containing `cloud` are filtered, but this is **not sufficient on its
  own**. For genuinely local Ollama operation, enable `disable_ollama_cloud`
  as described above and use downloaded local models only.
- `data/campus.sqlite3` is created automatically and stores conversations
  and the separate Advisor Q/A history without encryption. Use BitLocker or
  Windows device encryption when protection at rest is required.
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

- Python standard library for the normal local server. The optional ChatGPT
  connection installs one pinned identity-verification dependency only after a
  separate user approval; it is not part of Easy Start.
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
