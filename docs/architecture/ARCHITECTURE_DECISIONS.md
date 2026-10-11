# Architecture Decision Records

## AI-LAB-ADR-001 — Separate the public guide from the Local Lab

- Status: Accepted
- Date: 2026-10-09
- Owner: Markellos Ecosystem repository maintainer
- Related requirements: AI-LAB-OBJ-001, AI-LAB-AC-001 through AI-LAB-AC-003

The project needs a public installation guide without exposing the private local application. The selected design uses a static Cloudflare Pages artifact for the guide and retains the Lab as a Windows loopback application.

Consequences: the public artifact has no application API, form, chat input, account, analytics, or user-data processing; the Lab, Ollama, local models, and SQLite database remain outside public routing. A future hosted Lab requires a new approved architecture, security, privacy, and deployment scope.

## AI-LAB-ADR-002 — Use only local Ollama access for the Local Lab

- Status: Superseded by AI-LAB-ADR-003
- Date: 2026-10-09
- Owner: Markellos Ecosystem repository maintainer
- Related requirements: AI-LAB-OBJ-001, AI-LAB-SEC-003

The original Local Lab communicated only with Ollama on `127.0.0.1:11434`. It did not use cloud AI keys or a provider SDK. AI-LAB-ADR-003 retains the local-only boundary while broadening the fixed local provider set.

## AI-LAB-ADR-003 — Use fixed-loopback provider adapters for Local Lab inference

- Status: Accepted
- Date: 2026-10-11
- Owner: Markellos Ecosystem repository maintainer
- Related requirements: AI-LAB-OBJ-004, AI-LAB-AC-006, AI-LAB-SEC-004, AI-LAB-SEC-005

The Local Lab supports Ollama, LM Studio, and vLLM through a small provider-adapter
module. The registry hard-codes only `127.0.0.1:11434`, `127.0.0.1:1234/v1`, and
`127.0.0.1:8000/v1`; browsers submit a provider identifier rather than a URL.
Ollama retains its native API while LM Studio and vLLM use their OpenAI-compatible
`/models` and `/chat/completions` APIs.

Consequences: an unavailable provider is isolated and reported without fallback;
existing SQLite records and agent orchestration remain unchanged. RunPod, Cloud
Core, arbitrary endpoints, credentials, and remote inference require a separate
approved architecture and security scope.
