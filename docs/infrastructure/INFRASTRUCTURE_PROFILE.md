# Infrastructure Profile

Select one profile before development readiness. Infrastructure is optional; uncertainty is not `NOT_APPLICABLE`.

- `NOT_APPLICABLE` — no runtime or deployment infrastructure is required. State why and name the owner.
- `LOCAL_ONLY` — used only in approved local/developer environments.
- `SHARED_INFRASTRUCTURE` — adopts a shared, owner-managed ecosystem mechanism.
- `DEPLOYED_SERVICE` — this project owns or operates a deployed service integration.

## Record

- Selected profile: `DEPLOYED_SERVICE`
- Rationale and scope: Cloudflare Pages serves only the AI Agents Lab static information page at `ai-lab.markellosecosystem.com`.
- Infrastructure owner: Markellos Ecosystem repository maintainer.
- Selected upstream Infrastructure revision/pattern: Cloudflare Pages static deployment; no shared Infrastructure runtime is adopted.
- Environments and separation: Cloudflare Pages preview deployments precede the production deployment from `main`.
- Networking, ingress, and trust-boundary decision: Cloudflare terminates HTTPS for the public static origin. There is no route to the local Lab, Ollama, SQLite, or any application API.
- Deployment and rollback decision: Build `apps/ai-lab-landing/dist`, publish it through Pages, and use Pages rollback to return to the prior verified deployment.
- Backup/recovery applicability: no user or application data is stored by this site; source remains in Git and Pages retains deployment history.
- Health/observability evidence location: Cloudflare deployment status and post-deploy HTTPS/header check.
- Security dependencies and Shield requirements: public browser and deployment controls; no authentication, session, API, or data-processing boundary.
- Exceptions, risks, and review date: no approved exception; review before adding scripts, forms, data collection, or application routing.

This record does not replace Infrastructure-owned architecture or project-owned deployment configuration.
