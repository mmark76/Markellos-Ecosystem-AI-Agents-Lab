# Security Plan

## System Risk Profile

- Selected Shield revision / baseline: `d684570fb240fc5a84ff175fe6c16daabbbfdaa4`; public static-site controls.
- Exposure: public static HTTPS guide and a separate owner-controlled local Lab.
- Criticality: low; accurate public/local separation and private local conversation handling matter.
- Data sensitivity: the public page processes no Local Lab data. With explicit consent, GA4 processes standard public-site usage data and one non-sensitive ZIP-download event; the Local Lab stores private local SQLite conversation history.
- Main threat actors: opportunistic web attackers, content tampering attempts, users mistaking the page for a hosted Lab, and people with local-device access.
- Regulatory context: no intended public personal-data processing.

## Security Owners

- Product risk, security, incident, and data/privacy owner: Markellos Ecosystem repository maintainer.

## Required Controls

| Control ID | Control | Requirement ID | Owner | Verification | Evidence | Status |
|---|---|---|---|---|---|---|
| AI-LAB-SEC-001 | Static public artifact: no application API, form, account, or Local Lab data storage. | Shield public web controls | Repository maintainer | Inspect generated artifact. | `apps/ai-lab-landing/tests/build.test.cjs` | LOCAL VERIFICATION COMPLETE 2026-10-13; PRODUCTION PENDING |
| AI-LAB-SEC-002 | Browser security headers restrict sources, framing, referrers, permissions, and content types. | Shield public web controls | Repository maintainer | Inspect generated `_headers` and production headers. | Build test; Cloudflare post-deploy check. | LOCAL VERIFICATION COMPLETE; PRODUCTION PENDING |
| AI-LAB-SEC-003 | The public hostname has no route to the Local Lab, Ollama, or SQLite data. | Shield public web controls | Confirm Pages artifact and production routes. | Artifact review; Cloudflare post-deploy check. | PENDING EXTERNAL DEPLOYMENT |
| AI-LAB-SEC-004 | The Local Lab uses only the fixed loopback Ollama endpoint and excludes its database, models, and logs from Git. | Local application boundary | Inspect Ollama adapter, `.gitignore`, and local behavior. | Local Lab guide and tests. | LOCAL VERIFICATION COMPLETE 2026-10-12 |
| AI-LAB-SEC-005 | Provider and model identifiers are validated server-side; clients cannot submit provider URLs or select remote fallback. | Local application boundary | Provider and HTTP regression tests. | `apps/local-ai-agents-lab/tests/test_server.py`. | LOCAL VERIFICATION COMPLETE 2026-10-11 |
| AI-LAB-SEC-006 | Training accepts only enumerated local model and JSONL dataset names; outputs, datasets, models, and virtual environments are excluded from Git. | Local training boundary | Training unit tests and `.gitignore` inspection. | `tests/test_training.py`. | PHASE 1 PREPARED; ACTIVATION VERIFICATION PENDING |
| AI-LAB-SEC-007 | Fine-Tuning is disabled by default in both the local service and the same-origin HTTP route; no job configuration or training subprocess can start while locked. Read-only diagnostics do not probe the isolated runtime. Explicit CUDA errors without CPU fallback and no automatic driver, toolkit, package, model, or dataset installation remain required before future activation. | Local training boundary | Source plus mocked service/HTTP regression tests. | `tests/test_training.py`, `tests/test_server.py`. | FINE_TUNING_PHASE_1 — BACKEND LOCKED; ACTIVATION PENDING APPROVAL |
| AI-LAB-SEC-008 | Browser-initiated downloads require exact-origin POST, explicit confirmation, strictly validated Ollama model IDs, and a fixed loopback pull API; one download at a time, never cloud inference or arbitrary URLs. | Local Ollama model-management boundary | Installer unit/HTTP tests and code review. | `tests/test_model_install.py` and `tests/test_server.py`. | PENDING VERIFICATION |
| AI-LAB-SEC-009 | Update checks are explicit and query only the fixed official GitHub Releases API with bounded response/timeouts and validated official release/download URLs; no update is auto-downloaded, installed, or launched. | Local update-check boundary | Mocked update-check and UI/package tests. | `tests/test_updates.py` and release package test. | PENDING VERIFICATION |
| AI-LAB-SEC-010 | Easy Start detects before changing the device and has separate default-No confirmations for fixed Python/Ollama package installation, starting the local Ollama service, and downloading only `qwen2.5:0.5b` through fixed loopback. It has no arbitrary URL, script, driver, CUDA, update, or training-dependency path. | Windows bootstrap boundary | Source/package test and clean Windows smoke test. | `tests/build-release.test.cjs`, package inspection, and clean-device evidence. | SOURCE VERIFICATION PENDING |
| AI-LAB-SEC-011 | GA4 on the public landing page is disabled and unloaded until explicit consent; Reject and withdrawal disable future events; only page/navigation and ZIP-download events are sent; CSP permits only required Google origins after consent. | Public analytics consent boundary | Landing build/source and deterministic DOM/runtime regression. | `apps/ai-lab-landing/tests/build.test.cjs`. | LOCAL VERIFICATION COMPLETE 2026-10-13; PRODUCTION/DEBUGVIEW PENDING |

No production security claim is implied while Pages deployment verification remains pending. Do not commit credentials, model files, local SQLite data, populated configuration, or private operational evidence.
