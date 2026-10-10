# Test Strategy

## Required checks

| Level | Scope | Command | Evidence |
|---|---|---|---|
| Landing build | Static public guide artifact and headers. | `node apps/ai-lab-landing/build.cjs` | Generated `apps/ai-lab-landing/dist/` artifact. |
| Landing test | No-script static artifact contracts. | `node --test apps/ai-lab-landing/tests/build.test.cjs` | Node test output. |
| Local package test | Windows package metadata and release verification. | `node --test apps/local-ai-agents-lab/tests/build-release.test.cjs` | Node test output. |
| Local server tests | Loopback server and local data behavior. | `py -3 -m unittest discover -s apps/local-ai-agents-lab/tests` | Python test output. |
| Foundation validation | Pinned adoption asset integrity and bounded secret scan. | `node scripts/validate-foundations.cjs` | Validator output. |

## Manual checks

- Confirm the Local Lab starts only on `127.0.0.1:8765` and calls Ollama only on `127.0.0.1:11434`.
- Before an approved Pages deployment, inspect the preview for responsive layout, keyboard navigation, HTTPS, headers, and absence of local-Lab routes.
- Before releasing a Windows package, verify its generated build ID and preserve the existing local SQLite data during upgrade.

No production deployment, release publication, or external browser test is implied by these commands.
