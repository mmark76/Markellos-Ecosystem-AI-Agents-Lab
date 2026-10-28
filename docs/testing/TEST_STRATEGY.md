# Test Strategy

## Required checks

| Level | Scope | Command | Evidence |
|---|---|---|---|
| Landing build | Static public guide artifact and headers. | `node apps/ai-lab-landing/build.cjs` | Generated `apps/ai-lab-landing/dist/` artifact. |
| Landing test | Static artifact, cookie-less collector, informational-notice persistence, privacy text, and header contracts. | `node --test apps/ai-lab-landing/tests/build.test.cjs` | Node test output. |
| Public ZIP monitor | Current reviewed R2 ZIP availability, content type, exact content length, and SHA-256. | `node apps/ai-lab-landing/scripts/verify-public-distribution.cjs` | Manual release check and scheduled GitHub Actions workflow every six hours. |
| Local package test | Windows package metadata and release verification. | `node --test apps/local-ai-agents-lab/tests/build-release.test.cjs` | Node test output. |
| Local server tests | Loopback server, SQLite behavior, fixed-provider discovery/routing, and local data behavior. | `py -3 -m unittest discover -s apps/local-ai-agents-lab/tests` | Python test output. |
| Local training tests | JSONL validation, local path restrictions, CPU selection, and unsupported CUDA handling. | `py -3 -m unittest discover -s apps/local-ai-agents-lab/tests` | Python test output. |
| Local model downloader | Validate only local Ollama downloads and explicit model IDs; assert deterministic mocked progress, failure and concurrent-job handling. | `py -3 -m unittest discover -s apps/local-ai-agents-lab/tests` | `tests/test_model_install.py` output; real pull remains manual. |
| Local model installer UI | Reproduce completed and running-to-completed Ollama pulls in a browser-script harness without the retired single-model selector; verify success status, per-agent discovery refresh, and bounded repeated polling. | `node --test apps/local-ai-agents-lab/tests/model-install.test.cjs` | Node regression output; included in Local Lab CI. |
| Local update check | Validate the fixed official endpoint, bounded safe response, validated external links, and no automatic installation behavior. | `py -3 -m unittest discover -s apps/local-ai-agents-lab/tests` | `tests/test_updates.py` and shell/package test output. |
| Foundation validation | Pinned adoption asset integrity and bounded secret scan. | `node scripts/validate-foundations.cjs` | Validator output. |

## Manual checks

- Confirm the Local Lab starts only on `127.0.0.1:8765` and calls only Ollama at fixed loopback port `11434`.
- Before an approved Pages deployment, inspect the preview for responsive layout, keyboard navigation, HTTPS, headers, and absence of local-Lab routes.
- In a local or Pages preview, confirm that the informational notice appears on the first visit, close persists across reload, the Info control reopens it without changing the stored dismissal, cleared site data shows it again, and unavailable storage remains usable. Confirm that the central collector remains limited to one production-host script and that no Google, GA4, or download-event request is made.
- Before releasing a Windows package, verify its generated build ID and preserve the existing local SQLite data during upgrade.
- For the v2.0.26 Stop action, first run the new extracted launcher to register its per-user Stop protocol. Verify Stop prompts before terminating a recognized local Lab server, does not start a replacement, leaves an unrelated listener alone, and leaves Ollama running. Confirm Open AI Lab still opens a running server or starts it if absent. Older installed ZIPs cannot handle Stop.
- After an owner-approved Ollama model pull in the Local Lab, verify the success message and independent agent model dropdowns refresh without a JavaScript error; do not change an existing agent assignment automatically.
- Press **Check for updates** once with network access and confirm it reports the release or a non-destructive error; it must not download or alter files.
- Run a controlled CUDA training job only on a supported local GPU; mocked checks do not prove actual CUDA training.

No production deployment, release publication, or external browser test is implied by these commands.
