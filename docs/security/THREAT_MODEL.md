# Threat Model

Complete this project-owned record before development readiness and reassess it when scope, data, identity, exposure, architecture, dependencies, or deployment changes materially.

## Context

- Selected Shield source revision/baseline: `d684570fb240fc5a84ff175fe6c16daabbbfdaa4`; public static-site controls.
- Assets and data classification: public instructional content and deployment integrity; no user data, credentials, application database, or models.
- Actors and trust boundaries: anonymous readers access Cloudflare Pages over HTTPS; maintainers control the Git repository and Cloudflare project. The local Lab is outside this boundary.
- Entry points and dependencies: HTTPS GET requests to Cloudflare Pages; Cloudflare Pages and the repository build process.
- Assumptions and out-of-scope items: the local Lab may call only the fixed loopback APIs for Ollama, LM Studio, and vLLM. Hosting the Lab, arbitrary endpoints, RunPod, Cloud Core, and its SQLite database are out of scope.

## Threats and treatments

> Replace or remove every `EXAMPLE-*` row before approval. Do not place secrets or sensitive operational evidence here.

| Threat ID | Asset / boundary | Threat | Likelihood | Impact | Treatment / control | Verification / evidence | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| AI-LAB-THR-001 | Browser boundary | Script injection or an unexpected third-party connection. | Low | Medium | No JavaScript or third-party resources; CSP blocks scripts and network connections. | Artifact test and production header inspection. | Repository maintainer | PENDING |
| AI-LAB-THR-002 | Public/local product boundary | Visitor believes the public page hosts the Lab and discloses data there. | Medium | Medium | Prominent local-only wording; no chat input, form, or endpoint is present. | Content and artifact inspection. | Repository maintainer | PENDING |
| AI-LAB-THR-003 | Deployment integrity | Wrong Cloudflare output directory exposes unrelated repository content. | Low | High | Pages configuration names only `apps/ai-lab-landing/dist`; artifact is isolated and reviewed. | Build test and Pages configuration review. | Repository maintainer | PENDING EXTERNAL DEPLOYMENT |
| AI-LAB-THR-004 | Local inference boundary | A client attempts to redirect the Lab to a remote or attacker-controlled model endpoint. | Low | High | Provider registry contains only three hard-coded `127.0.0.1` endpoints; API accepts a provider identifier, never a URL. | Provider and HTTP regression tests. | Repository maintainer | PENDING VERIFICATION |

Unknown evidence is not a pass. Record approved deviations in `docs/governance/EXCEPTIONS.md` with risk, compensating controls, owner, approval, and review/expiry details.
