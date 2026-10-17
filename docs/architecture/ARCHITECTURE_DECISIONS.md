# Architecture Decision Records

## AI-LAB-ADR-001 — Separate the public guide from the Local Lab

- Status: Accepted
- Date: 2026-10-09
- Owner: Markellos Ecosystem repository maintainer
- Related requirements: AI-LAB-OBJ-001, AI-LAB-AC-001 through AI-LAB-AC-003

The project needs a public installation guide without exposing the private local application. The selected design uses a static Cloudflare Pages artifact for the guide and retains the Lab as a Windows loopback application.

Consequences: the public artifact has no application API, form, chat input, account, or Local Lab data processing; the Lab, Ollama, local models, and SQLite database remain outside public routing. AI-LAB-ADR-006 is the limited approved exception for consented public-site analytics. A future hosted Lab requires a new approved architecture, security, privacy, and deployment scope.

## AI-LAB-ADR-002 — Use only local Ollama access for the Local Lab

- Status: Superseded by AI-LAB-ADR-003
- Date: 2026-10-09
- Owner: Markellos Ecosystem repository maintainer
- Related requirements: AI-LAB-OBJ-001, AI-LAB-SEC-003

The original Local Lab communicated only with Ollama on `127.0.0.1:11434`. It did not use cloud AI keys or a provider SDK. AI-LAB-ADR-003 retains the local-only boundary while broadening the fixed local provider set.

## AI-LAB-ADR-003 — Use fixed-loopback Ollama-only inference for Local Lab

- Status: Accepted
- Date: 2026-10-11
- Owner: Markellos Ecosystem repository maintainer
- Related requirements: AI-LAB-OBJ-004, AI-LAB-AC-006, AI-LAB-SEC-004, AI-LAB-SEC-005

The Local Lab supports only Ollama through a small fixed-loopback adapter module.
The adapter hard-codes `127.0.0.1:11434`; browsers cannot submit an engine
identifier or URL. Ollama retains its native `/api/tags` and `/api/chat` APIs.

Consequences: an unavailable Ollama service is reported without fallback;
existing SQLite records and agent orchestration remain unchanged. LM Studio,
vLLM, RunPod, Cloud Core, arbitrary endpoints, credentials, and remote inference
require a separate approved architecture and security scope.

## AI-LAB-ADR-004 — Isolate optional parameter training from inference

- Status: Accepted
- Date: 2026-10-11
- Related requirements: AI-LAB-OBJ-006, AI-LAB-AC-008

Training uses a separate `training/.venv` and a fixed worker script. The server
validates selected model and JSONL dataset names against owned local folders,
then starts at most one worker when the feature is explicitly approved and
enabled. CUDA is a PyTorch execution choice, not an inference provider; an
explicit CUDA request fails when unsupported. This keeps the lightweight
server, inference adapters, and SQLite conversation history free of ML
dependencies and training side effects.

Phase 1 retains a hard disabled-by-default service and HTTP-route gate, so no
training configuration or worker subprocess can start in the released app.
Read-only status remains available without probing the isolated runtime. The
worker uses TRL `SFTConfig` for dataset and sequence-length settings and passes
`LoraConfig` to `SFTTrainer`; its only prepared method is supervised LoRA
adapter training, not full-parameter fine-tuning. Future activation requires a
separate approval and controlled integration verification.

## AI-LAB-ADR-005 — Keep update discovery separate from update installation

- Status: Accepted
- Date: 2026-10-11
- Related requirements: AI-LAB-OBJ-009, AI-LAB-AC-011, AI-LAB-SEC-009

The Local Lab has a small updates.py adapter that is called only when the user
presses the update-check control. It requests metadata from one fixed official
GitHub Releases API endpoint, bounds the response and timeout, and accepts only
matching official repository links. The browser receives a status and an
optional safe external link; it has no direct external connection.

Consequences: release discovery does not weaken the local inference boundary or
create an updater privilege. Download, extraction, replacement, and restart
remain a manual, user-controlled upgrade procedure.

## AI-LAB-ADR-006 — Gate GA4 behind explicit landing-page consent

- Status: Accepted
- Date: 2026-10-13
- Owner: Markellos Ecosystem repository maintainer
- Related requirements: AI-LAB-OBJ-014, AI-LAB-AC-016, AI-LAB-SEC-011

The public Cloudflare Pages landing page may use GA4 property `G-ZEPZK1T1YQ` to measure aggregate website use only after a visitor explicitly accepts analytics. The first-party dashboard script stores that choice locally, uses Consent Mode v2 consent signals, and dynamically loads Google's tag only after consent. It sends one manual page view per location and one `zip_download` event per Windows ZIP click. Rejecting or withdrawing consent disables future events.

Consequences: the CSP permits only the Google tag and analytics collection origins required after consent. No tag is included unconditionally, no sensitive or Local Lab data is sent, and no Local Lab source, build, or deployment setting changes.

## AI-LAB-ADR-007 — Keep remote GPU execution provider-neutral and file-based

- Status: Accepted
- Date: 2026-10-15
- Related requirements: AI-LAB-OBJ-006, AI-LAB-AC-008, AI-LAB-SEC-006, AI-LAB-SEC-007

The shared LoRA worker accepts a validated local job file and writes a local
status file plus adapter artifact. A small readiness probe collects host
evidence without installing packages, loading a model, or contacting a
provider. The released Local Lab continues to lock all training initiation.

Consequences: GPU infrastructure can be selected independently of the Windows
Lab and without a RunPod, cloud SDK, public route, or credential in the
repository. A future executor is responsible for explicitly approved transport,
authentication, artifact staging, timeout, cost, and teardown controls. This
decision does not implement remote execution or activate training.
