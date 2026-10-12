# Requirements Traceability Matrix

This project-owned record connects approved scope to implementation, verification, and evidence. It is an adoption mechanism, not a second requirements catalogue.

## Product and project requirements

| Requirement ID | Scope ID | Design / ADR | Implementation | Test IDs | Evidence | Owner | Status |
|---|---|---|---|---|---|---|---|
| AI-LAB-OBJ-001 | AI-LAB-SCOPE-001 | Static-only public boundary | `apps/ai-lab-landing/` | `AI-LAB-TEST-001` | Build test and Cloudflare deployment record | Repository maintainer | LOCAL VERIFICATION COMPLETE; EXTERNAL DEPLOYMENT PENDING |
| AI-LAB-OBJ-002 | AI-LAB-SCOPE-003 | Static canonical shell adaptation | `apps/ai-lab-landing/src/index.html`, `apps/ai-lab-landing/src/styles.css` | `AI-LAB-TEST-001` | Build test and local visual preview; deployment preview pending. | Repository maintainer | LOCAL VERIFICATION COMPLETE; DEPLOYMENT PENDING |
| AI-LAB-OBJ-003 | AI-LAB-SCOPE-002 | Versioned local-only release package | `apps/local-ai-agents-lab/` and release workflow | `AI-LAB-TEST-002` | Package verifier and release workflow run. | Repository maintainer | PENDING RELEASE PUBLICATION |
| AI-LAB-OBJ-004 | AI-LAB-SCOPE-004 | Fixed-loopback Ollama adapter | `apps/local-ai-agents-lab/providers.py`, `server.py`, and `static/` | `AI-LAB-TEST-003` | Ollama discovery, routing, non-Ollama rejection, and existing-flow regression tests. | Repository maintainer | LOCAL VERIFICATION COMPLETE 2026-10-12 |
| AI-LAB-OBJ-005 | AI-LAB-SCOPE-005 | Interactive canonical dashboard-shell adaptation | `apps/ai-lab-landing/src/` | `AI-LAB-TEST-004` | Landing build/source shell and bounded-preference tests. | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-OBJ-006 | AI-LAB-SCOPE-006 | Isolated local-training service and worker | `apps/local-ai-agents-lab/training.py`, `training/`, and `static/training.js` | `AI-LAB-TEST-005` | Training validation, CUDA mocks, and package-input tests. | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-OBJ-007 | AI-LAB-SCOPE-007 | Remove local language selectors and standardize the runtime UI and new responses on English | `apps/local-ai-agents-lab/static/`, `server.py` | `AI-LAB-TEST-006` | Local shell regression test and browser verification pending | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-OBJ-008 | AI-LAB-SCOPE-008 | Explicit fixed-loopback Ollama pull and local UI progress | `apps/local-ai-agents-lab/model_install.py`, `server.py`, and `static/model-install.js` | `AI-LAB-TEST-007` | Mock pull success, errors, validation, and packaging; real download pending approval | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-OBJ-009 | AI-LAB-SCOPE-009 | Explicit fixed official-release metadata check; manual installation remains outside the Lab | `apps/local-ai-agents-lab/updates.py`, `server.py`, and `static/updates.js` | `AI-LAB-TEST-008` | Mocked endpoint/link validation, shell/package tests, and published GitHub asset | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-OBJ-010 | AI-LAB-SCOPE-010 | Independent local Trainer/Student model selection with recoverable asynchronous session metadata | `apps/local-ai-agents-lab/server.py`, `providers.py`, and `static/` | `AI-LAB-TEST-009` | Inference-routing, SQLite migration, no inference deadline, partial-result, and UI visibility regression tests | Repository maintainer | PENDING VERIFICATION |

## Engineering Standards adoption

Record the detailed requirement mapping in `../../engineering/requirements/ENG_ADOPTION_MATRIX.md`. Link evidence here when an `ENG-*` requirement affects approved project scope.

| ENG ID | Applicability | Project requirement / decision | Evidence reference | Status |
|---|---|---|---|---|
| ENG-ARCH-001 | Applicable | Static source, build artifact, and deployment boundary are isolated in `apps/ai-lab-landing/`. | Source review and build test. | VERIFIED 2026-10-09 |
| ENG-DEP-001 | Applicable | Cloudflare Pages deployment is documented with named output and rollback procedure. | `apps/ai-lab-landing/README.md`. | PENDING EXTERNAL DEPLOYMENT |
| ENG-SEC-001 | Applicable | No application endpoint, personal data, or third-party script is deployed; restrictive headers are emitted. | Header and artifact inspection. | VERIFIED 2026-10-09 |
| ENG-TEST-001 | Applicable | Build output is covered by a Node test. | `apps/ai-lab-landing/tests/build.test.cjs`. | VERIFIED 2026-10-09 |
| ENG-DOC-001 | Applicable | Scope, deployment configuration, and public/local boundary are documented. | Project records and landing-page README. | VERIFIED 2026-10-09 |

## Shield adoption

Shield remains authoritative. Record applicable requirement/control IDs, the selected source revision, project control mapping, evidence location, and any approved exception without reproducing private Shield content.

| Shield ID | Source revision | Applicability | Project control / evidence | Status |
|---|---|---|---|---|
| Shield public web controls | d684570fb240fc5a84ff175fe6c16daabbbfdaa4 | Applicable | No scripts, no API, no data collection, restrictive headers, and Cloudflare-managed HTTPS. | LOCAL CONTROLS VERIFIED; HTTPS PENDING EXTERNAL DEPLOYMENT |

## Infrastructure adoption

The selected profile and integration details belong in `../infrastructure/INFRASTRUCTURE_PROFILE.md`.

| Infrastructure profile | Pattern / revision | Verification evidence | Status |
|---|---|---|---|
| DEPLOYED_SERVICE | Cloudflare Pages | Build test and post-deploy HTTPS verification. | PENDING EXTERNAL DEPLOYMENT |

## Completion rule

No mandatory requirement may be `VERIFIED` without applicable implementation, verification, evidence, current documentation, and a responsible owner. Unknown evidence is not a pass.
