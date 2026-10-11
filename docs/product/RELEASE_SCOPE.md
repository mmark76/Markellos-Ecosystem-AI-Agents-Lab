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
| AI-LAB-SCOPE-004 | Add fixed-loopback Ollama, LM Studio, and vLLM provider selection to the private Local Lab. | High | Repository maintainer | Approved by direct user request on 2026-10-11 |
| AI-LAB-SCOPE-005 | Adopt the complete interactive canonical dashboard shell for the public AI Agents Lab guide, using only local browser appearance preferences. | High | Repository maintainer | Approved by direct user request on 2026-10-11 |

## Out of scope

- Hosting the local AI Agents Lab, Ollama, SQLite data, or a chat API.
- Authentication, accounts, analytics, telemetry, or user-data collection. Local browser appearance preferences are permitted for AI-LAB-SCOPE-005 only.
- Remote inference, arbitrary provider URLs, RunPod, Cloud Core, credentials, or payment functionality.

## Foundation impact

- Applicable `ENG-*` requirements record: `ENG-ARCH-001`, `ENG-DEP-001`, `ENG-SEC-001`, `ENG-TEST-001`, and `ENG-DOC-001` are mapped in the traceability matrix.
- Applicable Shield requirements/baseline record: static public-site browser and deployment controls, recorded in the security plan and threat model.
- Infrastructure profile: `DEPLOYED_SERVICE` (Cloudflare Pages).
- Material architecture, security, or infrastructure change review required: Yes; the interactive local-preferences boundary is recorded under AI-LAB-SCOPE-005.
