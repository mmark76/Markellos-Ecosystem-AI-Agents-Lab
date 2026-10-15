# Requirements Traceability Matrix

This project-owned record connects approved scope to implementation, verification, and evidence. It is an adoption mechanism, not a second requirements catalogue.

## Product and project requirements

| Requirement ID | Scope ID | Design / ADR | Implementation | Test IDs | Evidence | Owner | Status |
|---|---|---|---|---|---|---|---|
| AI-LAB-OBJ-001 | AI-LAB-SCOPE-001 | Static-only public boundary and English README / Installation Guide | `apps/ai-lab-landing/src/index.html`, `src/simple-guide.html`, `src/PUBLIC_DOCUMENTATION.md` | `AI-LAB-TEST-001` | Build regression covers both Quick Start and retained Technical Documentation; Cloudflare deployment record pending | Repository maintainer | DOCUMENTATION UPDATE IN PR; EXTERNAL DEPLOYMENT PENDING |
| AI-LAB-OBJ-002 | AI-LAB-SCOPE-003 | Static canonical shell adaptation | `apps/ai-lab-landing/src/index.html`, `apps/ai-lab-landing/src/styles.css` | `AI-LAB-TEST-001` | Build test and local visual preview; deployment preview pending. | Repository maintainer | LOCAL VERIFICATION COMPLETE; DEPLOYMENT PENDING |
| AI-LAB-OBJ-003 | AI-LAB-SCOPE-002, AI-LAB-SCOPE-015 | Versioned local-only release package with isolated public R2 BETA distribution and a compact public archive from v1.0.0 onward | `apps/local-ai-agents-lab/`, `apps/ai-lab-landing/release-distribution.json`, landing build, and release workflow | `AI-LAB-TEST-002` and landing build regression | Published versioned R2 objects and checksums, anonymous SHA-256 verification, and Pages deployment record. | Repository maintainer | R2 ARCHIVE / PAGES DEPLOYMENT PENDING |
| AI-LAB-OBJ-004 | AI-LAB-SCOPE-004 | Fixed-loopback Ollama adapter | `apps/local-ai-agents-lab/providers.py`, `server.py`, and `static/` | `AI-LAB-TEST-003` | Ollama discovery, routing, non-Ollama rejection, and existing-flow regression tests. | Repository maintainer | LOCAL VERIFICATION COMPLETE 2026-10-12 |
| AI-LAB-OBJ-005 | AI-LAB-SCOPE-005 | Interactive canonical dashboard-shell adaptation | `apps/ai-lab-landing/src/` | `AI-LAB-TEST-004` | Landing build/source shell and bounded-preference tests. | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-OBJ-006 | AI-LAB-SCOPE-006 | Isolated local-training service and worker; Phase 1 locked activation boundary | `apps/local-ai-agents-lab/training.py`, `training/`, `server.py`, and retained Fine-Tuning guide | `AI-LAB-TEST-005` | Mocked pinned-TRL worker-contract, locked API/process, dependency/model failure, Learning Lab, Conference Room, shell, and package regression tests. | Repository maintainer | FINE_TUNING_PHASE_1 — COMPATIBILITY_PREPARED / BACKEND_LOCKED / AWAITING_APPROVAL |
| AI-LAB-OBJ-007 | AI-LAB-SCOPE-007 | Local runtime presentation and navigation clarity | `apps/local-ai-agents-lab/static/`, `server.py` | `AI-LAB-TEST-006` | Local shell regression test and browser verification pending | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-OBJ-008 | AI-LAB-SCOPE-008 | Explicit fixed-loopback Ollama pull and local UI progress | `apps/local-ai-agents-lab/model_install.py`, `server.py`, and `static/model-install.js` | `AI-LAB-TEST-007` | Mock pull success, errors, validation, and packaging; real download pending approval | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-OBJ-009 | AI-LAB-SCOPE-009 | Explicit fixed official-release metadata check; manual installation remains outside the Lab | `apps/local-ai-agents-lab/updates.py`, `server.py`, and `static/updates.js` | `AI-LAB-TEST-008` | Mocked endpoint/link validation, shell/package tests, and published GitHub asset | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-OBJ-010 | AI-LAB-SCOPE-010 | Independent local Trainer/Student model selection with recoverable asynchronous session metadata | `apps/local-ai-agents-lab/server.py`, `providers.py`, and `static/` | `AI-LAB-TEST-009` | Inference-routing, SQLite migration, no inference deadline, partial-result, and UI visibility regression tests | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-OBJ-011 | AI-LAB-SCOPE-011 | One locked session worker with durable serial stage records and best-effort Ollama release | `apps/local-ai-agents-lab/server.py`, `providers.py`, and `static/` | `AI-LAB-TEST-010` | Mocked sequential-routing, no-overlap, unload, migration, failure, UI-progress, response-action, and continuous-scroll layout regression tests | Repository maintainer | LOCAL VERIFICATION COMPLETE 2026-10-13 (MOCKED OLLAMA) |
| AI-LAB-OBJ-012 | AI-LAB-SCOPE-012 | Consent-based Windows prerequisite detection and bootstrap | `apps/local-ai-agents-lab/Start AI Agents Lab.bat`, `start-windows.bat`, and `scripts/easy-start.ps1` | `AI-LAB-TEST-011` | Source/package tests, PowerShell parser check, and clean Windows smoke test | Repository maintainer | SOURCE VERIFICATION PENDING |
| AI-LAB-OBJ-013 | AI-LAB-SCOPE-013 | Informational role-specific model guidance modal | `apps/local-ai-agents-lab/static/model-guidance-data.js`, `model-guidance.js`, `index.html`, and `style.css` | `AI-LAB-TEST-012` | Static shell, package, and local browser regression checks | Repository maintainer | LOCAL VERIFICATION PENDING |
| AI-LAB-OBJ-014 | AI-LAB-SCOPE-014 | Consent-gated GA4 adapter with no pre-consent external request | `apps/ai-lab-landing/src/dashboard.js`, `src/index.html`, `src/styles.css`, and `_headers` | `AI-LAB-TEST-013` | Build/source and deterministic DOM/runtime regression; optional GA4 DebugView | Repository maintainer | LOCAL VERIFICATION COMPLETE 2026-10-13; PRODUCTION/DEBUGVIEW PENDING |
| AI-LAB-OBJ-015 | AI-LAB-SCOPE-016 | Additive Evaluation Lab boundary; immutable snapshots and legacy Training Room records remain read-only | `apps/local-ai-agents-lab/evaluation_lab/` | `AI-LAB-TEST-014` | Temporary-SQLite contracts, migration, provenance, atomicity, and persistence tests; full Local Lab regression output | Repository maintainer | LOCAL VERIFICATION COMPLETE 2026-10-14 |
| AI-LAB-OBJ-016 | AI-LAB-SCOPE-017 | Independent fixed-loopback Evaluator adapter, prompt/response boundary, and one-shot execution engine | `apps/local-ai-agents-lab/evaluation_lab/{execution,model_adapter,prompt,response}.py` | `AI-LAB-TEST-015` | Mocked engine, timeout, malformed-response, provenance, interruption, duplicate-run, and atomic-persistence tests; full Local Lab regression output | Repository maintainer | LOCAL VERIFICATION COMPLETE 2026-10-14 |
| AI-LAB-OBJ-017 | AI-LAB-SCOPE-018 | Additive local Evaluation Lab API/service and browser workspace; existing Training Room and Conference Room routes retained | `apps/local-ai-agents-lab/evaluation_lab/http_api.py`, `server.py`, `static/evaluation.{js,css}`, `static/index.html` | AI-LAB-TEST-016 | Mocked HTTP create/list/read/execute tests, local engine regressions, and browser review | Repository maintainer | LOCAL AUTOMATED VERIFICATION COMPLETE; MANUAL UI REVIEW PENDING |

## Engineering Standards adoption

Record the detailed requirement mapping in `../../engineering/requirements/ENG_ADOPTION_MATRIX.md`. Link evidence here when an `ENG-*` requirement affects approved project scope.

| ENG ID | Applicability | Project requirement / decision | Evidence reference | Status |
|---|---|---|---|---|
| ENG-ARCH-001 | Applicable | Static source, build artifact, and deployment boundary are isolated in `apps/ai-lab-landing/`. | Source review and build test. | VERIFIED 2026-10-09 |
| ENG-DEP-001 | Applicable | Cloudflare Pages deployment is documented with named output and rollback procedure. | `apps/ai-lab-landing/README.md`. | PENDING EXTERNAL DEPLOYMENT |
| ENG-SEC-001 | Applicable | No application endpoint or Local Lab data is deployed; the only third-party script is consent-gated GA4 and restrictive headers are emitted. | Header, artifact, and consent regression inspection. | LOCAL VERIFICATION COMPLETE 2026-10-13; PRODUCTION PENDING |
| ENG-TEST-001 | Applicable | Build output is covered by a Node test. | `apps/ai-lab-landing/tests/build.test.cjs`. | VERIFIED 2026-10-09 |
| ENG-DOC-001 | Applicable | Scope, deployment configuration, and public/local boundary are documented. | Project records and landing-page README. | VERIFIED 2026-10-09 |

## Shield adoption

Shield remains authoritative. Record applicable requirement/control IDs, the selected source revision, project control mapping, evidence location, and any approved exception without reproducing private Shield content.

| Shield ID | Source revision | Applicability | Project control / evidence | Status |
|---|---|---|---|---|
| Shield public web controls | d684570fb240fc5a84ff175fe6c16daabbbfdaa4 | Applicable | No public application API; GA4 is consent-gated, has a narrow event allowlist, and is constrained by restrictive headers and Cloudflare-managed HTTPS. | LOCAL VERIFICATION COMPLETE 2026-10-13; PRODUCTION PENDING |

## Infrastructure adoption

The selected profile and integration details belong in `../infrastructure/INFRASTRUCTURE_PROFILE.md`.

| Infrastructure profile | Pattern / revision | Verification evidence | Status |
|---|---|---|---|
| DEPLOYED_SERVICE | Cloudflare Pages | Build test and post-deploy HTTPS verification. | PENDING EXTERNAL DEPLOYMENT |

## Completion rule

No mandatory requirement may be `VERIFIED` without applicable implementation, verification, evidence, current documentation, and a responsible owner. Unknown evidence is not a pass.
