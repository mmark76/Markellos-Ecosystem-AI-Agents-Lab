# Threat Model

Complete this project-owned record before development readiness and reassess it when scope, data, identity, exposure, architecture, dependencies, or deployment changes materially.

## Context

- Selected Shield source revision/baseline: `d684570fb240fc5a84ff175fe6c16daabbbfdaa4`; public static-site controls.
- Assets and data classification: public instructional content and deployment integrity; no user data, credentials, application database, or models.
- Actors and trust boundaries: anonymous readers access Cloudflare Pages over HTTPS; maintainers control the Git repository and Cloudflare project. The local Lab is outside this boundary.
- Entry points and dependencies: HTTPS GET requests to Cloudflare Pages; Cloudflare Pages and the repository build process.
- Assumptions and out-of-scope items: the local Lab may call only the fixed loopback Ollama API. Hosting the Lab, LM Studio, vLLM, arbitrary endpoints, RunPod, Cloud Core, and its SQLite database are out of scope.

## Threats and treatments

> Replace or remove every `EXAMPLE-*` row before approval. Do not place secrets or sensitive operational evidence here.

| Threat ID | Asset / boundary | Threat | Likelihood | Impact | Treatment / control | Verification / evidence | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| AI-LAB-THR-001 | Browser boundary | Script injection or an unexpected third-party connection. | Low | Medium | No JavaScript or third-party resources; CSP blocks scripts and network connections. | Artifact test and production header inspection. | Repository maintainer | PENDING |
| AI-LAB-THR-002 | Public/local product boundary | Visitor believes the public page hosts the Lab and discloses data there. | Medium | Medium | Prominent local-only wording; no chat input, form, or endpoint is present. | Content and artifact inspection. | Repository maintainer | PENDING |
| AI-LAB-THR-003 | Deployment integrity | Wrong Cloudflare output directory exposes unrelated repository content. | Low | High | Pages configuration names only `apps/ai-lab-landing/dist`; artifact is isolated and reviewed. | Build test and Pages configuration review. | Repository maintainer | PENDING EXTERNAL DEPLOYMENT |
| AI-LAB-THR-004 | Local inference boundary | A client attempts to redirect the Lab to a remote or attacker-controlled model endpoint. | Low | High | Provider registry contains only three hard-coded `127.0.0.1` endpoints; API accepts a provider identifier, never a URL. | Provider and HTTP regression tests. | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-THR-005 | Local training boundary | Browser input traverses into arbitrary files or causes a remote model/dataset fetch. | Low | High | Enumerated local directories, JSONL schema validation, fixed worker, and `local_files_only=True`. | Training unit tests and source review. | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-THR-006 | Device resources | A CUDA request unexpectedly consumes CPU or exhausts GPU memory. | Medium | Medium | Explicit CUDA availability validation, no fallback, single-job guard, confirmation, and safe failure status. | Mocked CUDA tests; controlled GPU run when hardware is present. | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-THR-007 | Local Ollama model-management boundary | A crafted model name redirects a download, triggers code execution, or causes an unapproved resource-consuming pull. | Medium | Medium | Strict model identifier regex, fixed loopback endpoint, no shell, exact-origin writes, explicit confirmation, one job, progress, errors, and documented disk/network/licensing risks. | `tests/test_model_install.py`, HTTP and UI regression tests. | Repository maintainer | PENDING VERIFICATION |
| AI-LAB-THR-008 | Local update-check boundary | A compromised or malformed response redirects the user to an untrusted download or silently changes the device. | Low | High | One fixed API endpoint, bounded response and timeout, semantic-version parsing, GitHub repository URL-prefix validation, explicit link click, and no download/install/launch behavior. | `tests/test_updates.py`, shell/package tests, and source review. | Repository maintainer | PENDING VERIFICATION |

Unknown evidence is not a pass. Record approved deviations in `docs/governance/EXCEPTIONS.md` with risk, compensating controls, owner, approval, and review/expiry details.
