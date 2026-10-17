# AI Lab — public current-state documentation

This public guide describes the released Local Lab as it is, without claiming future or unavailable functionality.

## Quick Start (Windows)

The application is free to use, runs locally, and requires no subscription. After installing prerequisites and downloading a local model, basic inference can work without an Internet connection. Downloads and updates still require connectivity. To ensure fully local Ollama behavior, disable its cloud features as documented in the packaged Local Lab README.

1. Download `AI-Agents-Lab-Windows.zip` from the public landing page; a GitHub account is not required.
2. Extract the ZIP into a folder on your Windows PC.
3. Double-click `Start AI Training Lab.bat`. Easy Start checks prerequisites and requests separate approval before installing Python or Ollama, starting Ollama, or downloading the first local model. When setup succeeds, open `http://127.0.0.1:8765/`.

### Understanding the three Windows .bat files

- **`Start AI Training Lab.bat` — recommended:** Beginner-friendly setup and launch. The current public ZIP contains this main launcher. Follow the README packaged with your downloaded ZIP.
- **`start-windows.bat` — alternative:** Starts the same readiness-first local workflow for users who prefer the direct Windows launcher.
- **`setup-training-windows.bat` — advanced setup, not normal installation:** Separate optional fine-tuning setup. Model-weight fine-tuning is currently disabled; do not use this file to start the Lab.

For a more accessible explanation, use the linked `simple-guide.html` page. The following technical release notes remain available in full.

## Technical documentation

## Public distribution

`AI-Agents-Lab-Windows.zip` for `v1.0.0` is distributed through the public Cloudflare R2 BETA channel, without GitHub authentication. The GitHub repository remains private. The dashboard displays the stable versioned URL and SHA-256 checksum (`98d5b560e5bdbdd6888adcef29c820d793d389fcfda022a56a326a0365af9fc5`) for verification.

## Available now

- Local Agent Training through Ollama only, using the released sequence: Trainer → Student → Evaluator → Improver.
- A local-only application boundary: the Lab uses Ollama at `127.0.0.1:11434` and does not provide a hosted AI API.
- Windows Easy Start: after extracting the ZIP, `Start AI Training Lab.bat` checks prerequisites and requests separate explicit approval before it installs Python, installs Ollama, starts Ollama, or downloads the initial local `qwen2.5:0.5b` model. It reuses ready local components and starts the Lab automatically only after setup succeeds.

## Under construction in v0.1.30

- Agent Collaboration / Conference Room: available from v1.1.6, with Planner, Researcher, and Reviewer using local Ollama.
- Optional advanced model fine-tuning: not operational pending resolution of a confirmed training-worker compatibility issue.
- Manual update checking inside the Local App: not implemented.
- LM Studio and vLLM inference: not supported.

## Installation when an authorized ZIP is provided

Extract the authorized ZIP to a folder you control, then start `Start AI Training Lab.bat`. The first setup needs Internet access, Windows Package Manager, and at least 3 GiB of free disk space. Every device-changing step requires its own explicit approval. The Local App is reached only after it starts, at `http://127.0.0.1:8765/`.
