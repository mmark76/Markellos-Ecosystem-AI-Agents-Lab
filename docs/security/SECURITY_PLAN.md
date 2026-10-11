# Security Plan

## System Risk Profile

- Selected Shield revision / baseline: `d684570fb240fc5a84ff175fe6c16daabbbfdaa4`; public static-site controls.
- Exposure: public static HTTPS guide and a separate owner-controlled local Lab.
- Criticality: low; accurate public/local separation and private local conversation handling matter.
- Data sensitivity: the public page processes no user or Lab data; the Local Lab stores private local SQLite conversation history.
- Main threat actors: opportunistic web attackers, content tampering attempts, users mistaking the page for a hosted Lab, and people with local-device access.
- Regulatory context: no intended public personal-data processing.

## Security Owners

- Product risk, security, incident, and data/privacy owner: Markellos Ecosystem repository maintainer.

## Required Controls

| Control ID | Control | Requirement ID | Owner | Verification | Evidence | Status |
|---|---|---|---|---|---|---|
| AI-LAB-SEC-001 | Static-only artifact: no script, forms, analytics, API, accounts, or user-data storage. | Shield public web controls | Repository maintainer | Inspect generated artifact. | `apps/ai-lab-landing/tests/build.test.cjs` | VERIFIED 2026-10-09 |
| AI-LAB-SEC-002 | Browser security headers restrict sources, framing, referrers, permissions, and content types. | Shield public web controls | Repository maintainer | Inspect generated `_headers` and production headers. | Build test; Cloudflare post-deploy check. | LOCAL VERIFICATION COMPLETE; PRODUCTION PENDING |
| AI-LAB-SEC-003 | The public hostname has no route to the Local Lab, Ollama, or SQLite data. | Shield public web controls | Confirm Pages artifact and production routes. | Artifact review; Cloudflare post-deploy check. | PENDING EXTERNAL DEPLOYMENT |
| AI-LAB-SEC-004 | The Local Lab uses only fixed loopback Ollama, LM Studio, and vLLM endpoints and excludes its database, models, and logs from Git. | Local application boundary | Inspect provider registry, `.gitignore`, and local behavior. | Local Lab guide and tests. | LOCAL VERIFICATION COMPLETE 2026-10-11 |
| AI-LAB-SEC-005 | Provider and model identifiers are validated server-side; clients cannot submit provider URLs or select remote fallback. | Local application boundary | Provider and HTTP regression tests. | `apps/local-ai-agents-lab/tests/test_server.py`. | LOCAL VERIFICATION COMPLETE 2026-10-11 |
| AI-LAB-SEC-006 | Training accepts only enumerated local model and JSONL dataset names; outputs, datasets, models, and virtual environments are excluded from Git. | Local training boundary | Training unit tests and `.gitignore` inspection. | `tests/test_training.py`. | PENDING VERIFICATION |
| AI-LAB-SEC-007 | One explicitly confirmed training worker runs at a time; explicit CUDA errors without CPU fallback; no automatic driver, toolkit, package, model, or dataset installation. | Local training boundary | Source and unit-test inspection. | Training service tests. | PENDING VERIFICATION |
| AI-LAB-SEC-008 | Browser-initiated downloads require exact-origin POST, explicit confirmation, strictly validated Ollama model IDs, and a fixed loopback pull API; one download at a time, never cloud inference or arbitrary URLs. | Local Ollama model-management boundary | Installer unit/HTTP tests and code review. | `tests/test_model_install.py` and `tests/test_server.py`. | PENDING VERIFICATION |

No production security claim is implied while Pages deployment verification remains pending. Do not commit credentials, model files, local SQLite data, populated configuration, or private operational evidence.
