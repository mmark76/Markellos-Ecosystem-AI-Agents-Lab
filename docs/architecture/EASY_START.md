# Windows Easy Start

## Text encoding

`start-windows.bat` launches `easy-start.ps1` with Windows PowerShell
(`powershell.exe`). Keep `easy-start.ps1` encoded as UTF-8 **with BOM** so that
Windows PowerShell 5.1 reads punctuation in dialog titles and progress messages
correctly. The release builder copies the original script bytes unchanged;
`apps/local-ai-agents-lab/tests/build-release.test.cjs` guards the BOM.

## Purpose

Easy Start makes the Windows ZIP usable by a beginner without hiding device
changes. `Start AI Agents Lab.bat` runs a readiness-first PowerShell dialog
before it starts the local server.

## Fixed boundary

- It detects Python 3.9 or later, Ollama, the local Ollama service, and the
  initial `qwen2.5:0.5b` model before changing anything.
- If software is missing, it can request the fixed official Windows Package
  Manager IDs `Python.Python.3.12` and `Ollama.Ollama` only.
- It talks to Ollama only at `127.0.0.1:11434`; the only model pull is the
  fixed `qwen2.5:0.5b` request sent through that local service.
- It does not download or execute arbitrary URLs, drivers, CUDA components,
  training dependencies, updates, or source code.

## Explicit approval points

The dialog defaults every confirmation to **No** and asks separately before it:

1. installs Python;
2. installs Ollama;
3. starts installed Ollama locally; or
4. downloads the first local model.

Refusing any prompt stops the related work. Easy Start does not continue to a
later device-changing action after a required approval is refused.

## Operational behavior

Existing compatible software and the initial model are reused. The dialog
checks for at least 3 GiB free space before setup. Once all requirements are
ready, the existing launcher creates the desktop shortcut and starts the
loopback Lab. The companion package and source tests inspect the fixed IDs,
loopback URLs, consent prompts, and packaged files. A clean Windows smoke test
remains required before declaring a release verified for a new device.
