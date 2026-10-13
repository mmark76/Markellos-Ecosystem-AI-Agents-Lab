# AI Agents Lab v0.1.28 — public current-state documentation

This public guide describes the released Local Lab as it is, without claiming future or unavailable functionality.

## Public distribution

`AI-Agents-Lab-Windows.zip` for `v0.1.28` is distributed through the public Cloudflare R2 BETA channel, without GitHub authentication. The GitHub repository remains private. The dashboard displays the stable versioned URL and SHA-256 checksum (`12d6d73dce2939e4e1f02f3e6a2a20932f2b6688f1b643ad2821900e9ffcaed3`) for verification.

## Available now

- Local Agent Training through Ollama only, using the released sequence: Trainer → Student → Evaluator → Improver.
- A local-only application boundary: the Lab uses Ollama at `127.0.0.1:11434` and does not provide a hosted AI API.
- Windows Easy Start: after extracting the ZIP, `Start AI Agents Lab.bat` checks prerequisites and requests separate explicit approval before it installs Python, installs Ollama, starts Ollama, or downloads the initial local `qwen2.5:0.5b` model. It reuses ready local components and starts the Lab automatically only after setup succeeds.

## Under construction in v0.1.28

- Agent Collaboration / Conference Room: the released UI keeps it disabled. Supporting code is not a verified user-available feature.
- Optional advanced model fine-tuning: not operational pending resolution of a confirmed training-worker compatibility issue.
- Manual update checking inside the Local App: not implemented.
- LM Studio and vLLM inference: not supported.

## Installation when an authorized ZIP is provided

Extract the authorized ZIP to a folder you control, then start `Start AI Agents Lab.bat`. The first setup needs Internet access, Windows Package Manager, and at least 3 GiB of free disk space. Every device-changing step requires its own explicit approval. The Local App is reached only after it starts, at `http://127.0.0.1:8765/`.
