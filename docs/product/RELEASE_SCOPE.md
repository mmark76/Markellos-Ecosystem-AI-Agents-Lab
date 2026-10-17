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
| AI-LAB-SCOPE-013 | Provide optional, vendor-neutral informational Model Guidance for the four Learning Lab roles without changing model selection or execution. | Medium | Repository maintainer | Approved by direct user request on 2026-10-13 |
| AI-LAB-SCOPE-014 | Add consented Google Analytics 4 to the public Cloudflare Pages landing page only, including page/navigation and ZIP-download measurement, withdrawal controls, and accurate privacy information. | High | Repository maintainer | Approved by direct user request on 2026-10-13 |
| AI-LAB-SCOPE-015 | Retain and provide the public Windows ZIP archive from v1.0.0 onward in a compact, collapsed release-history control for future agent studies. | Medium | Repository maintainer | Approved by direct user request on 2026-10-14 |
| AI-LAB-SCOPE-016 | Establish the additive, independent Evaluation Lab persistence foundation for read-only evaluation of completed Training Room records. | High | Repository maintainer | Approved by direct user request on 2026-10-14 |
| AI-LAB-SCOPE-017 | Add an independent, fixed-loopback local Evaluator execution engine for persisted Evaluation Lab runs without changing Training Room behavior. | High | Repository maintainer | Approved by direct user request on 2026-10-14 |
| AI-LAB-SCOPE-018 | Integrate the independent Evaluation Lab into the local application with bounded same-origin HTTP routes, explicit run initiation, read-only Training Room session selection, and qualified scorecard/findings UI. | High | Repository maintainer | Approved by direct user request on 2026-10-15 |
| AI-LAB-SCOPE-019 | Align the Local Lab with the approved five active Lab and fifteen Lab-scoped agent architecture while preserving local-only boundaries and legacy Training history. | High | Repository maintainer | Approved by direct user request on 2026-10-16 |
| AI-LAB-SCOPE-020 | Add the first local, user-owned provider planning surface for remote LoRA fine-tuning. The user declares a provider, spend and runtime limits; Phase 3A neither collects credentials nor executes a remote job. | High | Repository maintainer | Approved by direct user request on 2026-10-16 |
| AI-LAB-SCOPE-021 | Add explicit, Windows-user-scoped encrypted custody for a user-owned RunPod access token, with status and removal controls. Phase 3B stores no plan, starts no provider request, and performs no training. | High | Repository maintainer | Approved by direct user request on 2026-10-17 |
| AI-LAB-SCOPE-022 | Add one explicit read-only RunPod connection control that validates the locally protected token and reads a fixed GPU catalog/pricing query. It cannot create or manage provider resources. | High | Repository maintainer | Approved by direct user request on 2026-10-17 |
| AI-LAB-SCOPE-023 | Add an optional, user-approved Sign in with ChatGPT bridge for the local Windows Lab. It must not accept API keys, initiate model inference, or create a charge merely by connecting. | High | Repository maintainer | Approved by direct user request on 2026-10-17 |
| AI-LAB-SCOPE-024 | Add an optional external ChatGPT advisor that works in parallel with local agents only after the user explicitly selects and confirms one review packet. It must never read or synchronize local-room conversations automatically; disconnecting removes the local connection and returns the Lab to local-only operation. | High | Repository maintainer | Approved by direct user request on 2026-10-17 |

## Out of scope

- Hosting the local AI Agents Lab, Ollama, SQLite data, or a chat API.
- Authentication, accounts, telemetry, or user-data collection beyond AI-LAB-SCOPE-014. Local browser appearance preferences are permitted for AI-LAB-SCOPE-005 only; GA4 is permitted only after explicit consent under AI-LAB-SCOPE-014.
- Remote inference, arbitrary provider URLs, RunPod, Cloud Core, credentials, or payment functionality.
- Remote training, cloud API keys, automatic training-model/dataset downloads, distributed training, DPO, and RLHF.
- Cloud model pulls, unmanaged model URLs, arbitrary network endpoints, and in-app downloads for non-Ollama engines; AI-LAB-SCOPE-008 permits only explicit owner-confirmed Ollama pulls through fixed loopback.
- Automatic update downloads, installation, executable launch, release-channel selection, and arbitrary update URLs; AI-LAB-SCOPE-009 permits a manual check of one fixed official GitHub Releases endpoint only.
- Silent dependency installation, unverified download URLs, driver or CUDA installation, arbitrary scripts, automatic model pulls, and any device change without the relevant Easy Start approval dialog.
- Provider API calls, remote execution, paid provisioning, model/dataset transfers, and credential use remain out of scope except AI-LAB-SCOPE-022's explicit, fixed, read-only RunPod account/GPU-catalog check. It cannot create, alter, or charge provider resources.
- OpenAI API keys, automatic cloud prompts, automatic cloud inference, remote training, and background conversation synchronization remain out of scope. AI-LAB-SCOPE-023 permits browser-mediated OAuth/OpenID Connect custody; AI-LAB-SCOPE-024 permits only an explicitly confirmed, user-selected external-advisor packet through the signed-in ChatGPT account.

## Foundation impact

- Applicable `ENG-*` requirements record: `ENG-ARCH-001`, `ENG-DEP-001`, `ENG-SEC-001`, `ENG-TEST-001`, and `ENG-DOC-001` are mapped in the traceability matrix.
- Applicable Shield requirements/baseline record: static public-site browser and deployment controls, recorded in the security plan and threat model.
- Infrastructure profile: `DEPLOYED_SERVICE` (Cloudflare Pages).
- Material architecture, security, or infrastructure change review required: Yes; the interactive local-preferences boundary is recorded under AI-LAB-SCOPE-005 and the consented GA4 boundary under AI-LAB-SCOPE-014.
