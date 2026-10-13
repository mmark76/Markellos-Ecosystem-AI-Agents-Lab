# Release Scope

## Release identity

- Release name/version: AI Agents Lab public landing page 0.1.0
- Owner: Markellos Ecosystem repository maintainer
- Approval date: 2026-10-09

## In scope

| Scope ID | Outcome | Priority | Owner | Approval status |
|---|---|---|---|---|
| AI-LAB-SCOPE-001 | Publish a static, privacy-preserving guide at `ai-lab.markellosecosystem.com` through Cloudflare Pages. | High | Repository maintainer | Approved by direct user request on 2026-10-09 |
| AI-LAB-SCOPE-002 | Provide a versioned public Windows ZIP and direct installation path for the local AI Agents Lab. | High | Repository maintainer | Approved by direct user request on 2026-10-10 |
| AI-LAB-SCOPE-003 | Adopt the static visual and structural elements of the Ecosystem Framework canonical dashboard shell for the public guide, without JavaScript. | Medium | Repository maintainer | Approved by direct user request on 2026-10-10 |
| AI-LAB-SCOPE-004 | Use fixed-loopback Ollama-only inference in the private Local Lab. | High | Repository maintainer | Superseded by direct user request on 2026-10-12 |
| AI-LAB-SCOPE-005 | Adopt the complete interactive canonical dashboard shell for the public AI Agents Lab guide, using only local browser appearance preferences. | High | Repository maintainer | Approved by direct user request on 2026-10-11 |
| AI-LAB-SCOPE-006 | Add an optional, isolated local PyTorch LoRA/SFT training workspace with CPU/CUDA selection while preserving fixed-loopback inference. | High | Repository maintainer | Approved by direct user request on 2026-10-11 |
| AI-LAB-SCOPE-007 | Remove the two Local Lab language selectors and standardize its runtime UI and new agent responses on English while retaining model routing and local-only operation. | Medium | Repository maintainer | Approved by direct user request on 2026-10-12 |
| AI-LAB-SCOPE-008 | Add an explicitly confirmed, local-only Ollama model downloader in the private Lab with progress, safe model-name validation, and refreshed model discovery. | Medium | Repository maintainer | Approved by direct user request on 2026-10-11 |
| AI-LAB-SCOPE-009 | Publish a refreshed Windows release and add an explicit, safe Local Lab update check that never automatically downloads or installs files. | High | Repository maintainer | Approved by direct user request on 2026-10-11 |
| AI-LAB-SCOPE-010 | Let Learning Lab users independently assign installed local models to Trainer and Student agents while preserving the fixed-loopback provider boundary. | High | Repository maintainer | Approved by direct user request on 2026-10-12 |
| AI-LAB-SCOPE-011 | Extend Learning Lab to a strictly sequential four-stage Trainer, Student, Evaluator, Improver learning cycle with independent local Ollama model assignments and durable per-stage results. | High | Repository maintainer | Approved by direct user request on 2026-10-12 |
| AI-LAB-SCOPE-012 | Provide a Windows Easy Start bootstrap that checks prerequisites and requests a separate explicit user approval before installing Python, installing Ollama, starting Ollama, or downloading the initial local model. | High | Repository maintainer | Approved by direct user request on 2026-10-13 |

## Out of scope

- Hosting the local AI Agents Lab, Ollama, SQLite data, or a chat API.
- Authentication, accounts, analytics, telemetry, or user-data collection. Local browser appearance preferences are permitted for AI-LAB-SCOPE-005 only.
- Remote inference, arbitrary provider URLs, RunPod, Cloud Core, credentials, or payment functionality.
- Remote training, cloud API keys, automatic training-model/dataset downloads, distributed training, DPO, and RLHF.
- Cloud model pulls, unmanaged model URLs, arbitrary network endpoints, and in-app downloads for non-Ollama engines; AI-LAB-SCOPE-008 permits only explicit owner-confirmed Ollama pulls through fixed loopback.
- Automatic update downloads, installation, executable launch, release-channel selection, and arbitrary update URLs; AI-LAB-SCOPE-009 permits a manual check of one fixed official GitHub Releases endpoint only.
- Silent dependency installation, unverified download URLs, driver or CUDA installation, arbitrary scripts, automatic model pulls, and any device change without the relevant Easy Start approval dialog.

## Foundation impact

- Applicable `ENG-*` requirements record: `ENG-ARCH-001`, `ENG-DEP-001`, `ENG-SEC-001`, `ENG-TEST-001`, and `ENG-DOC-001` are mapped in the traceability matrix.
- Applicable Shield requirements/baseline record: static public-site browser and deployment controls, recorded in the security plan and threat model.
- Infrastructure profile: `DEPLOYED_SERVICE` (Cloudflare Pages).
- Material architecture, security, or infrastructure change review required: Yes; the interactive local-preferences boundary is recorded under AI-LAB-SCOPE-005.
