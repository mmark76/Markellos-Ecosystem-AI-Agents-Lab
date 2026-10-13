# AI Agents Lab v0.1.26 — public current-state documentation

This public guide describes the released Local Lab as it is, without claiming future or unavailable functionality.

## Public distribution

`AI-Agents-Lab-Windows.zip` for `v0.1.26` is distributed through the public Cloudflare R2 BETA channel, without GitHub authentication. The GitHub repository remains private. The dashboard displays the stable versioned URL and SHA-256 checksum (`a6d4d108024f1ae9ea0526d8341fbcaca216c193dc912ced42a56ae7f5874797`) for verification.

## Available now

- Local Agent Training through Ollama only, using the released sequence: Trainer → Student → Evaluator → Improver.
- A local-only application boundary: the Lab uses Ollama at `127.0.0.1:11434` and does not provide a hosted AI API.

## Under construction in v0.1.26

- Agent Collaboration / Conference Room: the released UI keeps it disabled. Supporting code is not a verified user-available feature.
- Optional advanced model fine-tuning: not operational pending resolution of a confirmed training-worker compatibility issue.
- Manual update checking inside the Local App: not implemented.
- LM Studio and vLLM inference: not supported.

## Installation when an authorized ZIP is provided

Install Python 3.9 or later and Ollama, run a local Ollama model, extract the authorized ZIP to a folder you control, then start `start-windows.bat`. The Local App is reached only after it starts, at `http://127.0.0.1:8765/`.
