# System Architecture

## Context and boundaries

AI Agents Lab has two deliberately separated components:

| Component | Purpose | Exposure | Data boundary |
|---|---|---|---|
| Local Lab | Local learning and role-based agent conversations using Ollama. | Windows loopback only (`127.0.0.1`). | Local SQLite session history and downloaded local models. |
| Public landing page | Explain installation, local-only use, and release downloads. | Static HTTPS through Cloudflare Pages. | No application or visitor data. |

The public site never proxies, embeds, or routes to the Local Lab, Ollama, or SQLite. The Local Lab never requires a cloud API key or public ingress.

## Architecture drivers

- Privacy: conversations and model access remain on the local device.
- Safety: the public guide must not look or behave like a hosted AI service.
- Maintainability: the Lab uses Python standard-library components and narrow provider adapters for fixed local APIs; the public guide is static HTML/CSS.
- Accessibility: the public guide provides semantic HTML, visible keyboard focus, responsive layout, and no script dependency.

## Modules and ownership

| Module | Responsibility | Dependencies | Owner |
|---|---|---|---|
| `apps/local-ai-agents-lab/server.py` | Loopback HTTP server, local persistence, and agent orchestration. | Python standard library; provider adapter. | Repository maintainer |
| `apps/local-ai-agents-lab/providers.py` | Ollama model discovery and chat adapter. | Fixed loopback Ollama API. | Repository maintainer |
| `apps/local-ai-agents-lab/static/` | Local Lab browser interface. | Local loopback server only. | Repository maintainer |
| `apps/local-ai-agents-lab/training.py` and `training/` | Validated local training orchestration and isolated PyTorch worker. | Fixed local folders and a separate Python virtual environment. | Repository maintainer |
| `apps/ai-lab-landing/` | Static public installation guide and Pages artifact. | Node build script; Cloudflare Pages at deployment. | Repository maintainer |
| `docs/` | Project decisions, controls, evidence references, and operating records. | Versioned repository content. | Repository maintainer |

## Data flow

1. A local browser communicates with the Local Lab at `127.0.0.1:8765`.
2. The Lab communicates only with Ollama at `127.0.0.1:11434`; it does not accept an engine identifier or URL.
3. Local conversation records are stored in the Lab SQLite database and are excluded from Git.
4. Public visitors receive only static landing-page files through Cloudflare Pages.
5. Training requests select only local `models/` and `training-data/` entries; the optional worker writes adapters/checkpoints to `training-output/` and never uses inference adapters or SQLite history.

## Deployment and recovery

- Local Lab: an owner-controlled Windows installation; release packaging is verified before distribution.
- Public landing page: `apps/ai-lab-landing/dist` is the only Cloudflare Pages artifact; rollback uses Pages deployment history.
- Local data recovery: stop the local server before copying or restoring the SQLite database.
- No production database, secrets manager, public API, or shared runtime is in the approved scope.
