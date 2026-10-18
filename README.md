# Markellos Ecosystem AI Lab

AI Lab is a local-first experimentation environment for a Windows device, with a small public landing page that explains installation and its privacy boundary. It is not a cloud AI service, academic institution, autonomous deployment system, or public chat endpoint.

## Components

- [`apps/local-ai-agents-lab/`](apps/local-ai-agents-lab/) is the private local application. It binds only to loopback, uses the local Ollama API, and stores local session history in SQLite.
- [`apps/ai-lab-landing/`](apps/ai-lab-landing/) is the public static Cloudflare Pages guide at `ai-lab.markellosecosystem.com`. It does not host the Lab, Ollama, a chat service, accounts, analytics, or user data.

## Start here

1. Read the [Project Brief](docs/product/PROJECT_BRIEF.md) and [Release Scope](docs/product/RELEASE_SCOPE.md).
2. For local use, follow the [Local Lab guide](apps/local-ai-agents-lab/README.md).
3. For the public guide, follow the [Landing-page guide](apps/ai-lab-landing/README.md).
4. Review the [Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md), [Security Plan](docs/security/SECURITY_PLAN.md), and [Threat Model](docs/security/THREAT_MODEL.md) before a material change.
5. For optional, manual learning exercises, browse the [Educational Resource Library](docs/learning/EDUCATIONAL_RESOURCE_LIBRARY.md) and [five Lab starter exercises](docs/learning/STARTER_EXERCISES.md). No external datasets or benchmark tools are installed by these references.

## Boundaries

- The public site and private Lab are separate deployment and trust boundaries.
- The public site is static-only: no JavaScript, forms, accounts, telemetry, analytics, API, or data collection.
- The Lab remains local-only unless separately approved scope changes that decision.
- No credentials, local database, model files, or operational evidence belong in Git.

## Validation

```text
node apps/ai-lab-landing/build.cjs
node --test apps/ai-lab-landing/tests/build.test.cjs
node --test apps/local-ai-agents-lab/tests/build-release.test.cjs
py -3 -m unittest discover -s apps/local-ai-agents-lab/tests
node scripts/validate-foundations.cjs
```

The `foundations/` directory and design-system assets are pinned, sanitized adoption material. They retain upstream authority and should be upgraded through a reviewed provenance change, not rewritten as Lab-specific content.
