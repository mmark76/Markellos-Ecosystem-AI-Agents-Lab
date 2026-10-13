# AI Agents Lab v0.1.24 — public current-state documentation

This public guide describes the released Local Lab as it is, without claiming future or unavailable functionality.

## Public distribution

`AI-Agents-Lab-Windows.zip` for `v0.1.24` is hosted in a private GitHub repository. Anonymous public download is currently unavailable. Do not rely on a public GitHub Release URL until an authorized public distribution path is available.

## Available now

- Local Agent Training through Ollama only, using the released sequence: Trainer → Student → Evaluator → Improver.
- A local-only application boundary: the Lab uses Ollama at `127.0.0.1:11434` and does not provide a hosted AI API.

## Not available in v0.1.24

- Agent Collaboration / Conference Room: the released UI keeps it disabled. Supporting code is not a verified user-available feature.
- Optional advanced model fine-tuning: not operational pending resolution of a confirmed training-worker compatibility issue.
- Manual update checking inside the Local App: not implemented.
- LM Studio and vLLM inference: not supported.

## Installation when an authorized ZIP is provided

Install Python 3.9 or later and Ollama, run a local Ollama model, extract the authorized ZIP to a folder you control, then start `start-windows.bat`. The Local App is reached only after it starts, at `http://127.0.0.1:8765/`.
