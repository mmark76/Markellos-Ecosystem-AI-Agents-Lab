# Test Strategy

## Required checks

| Level | Scope | Command | Evidence |
|---|---|---|---|
| Landing build | Static public guide artifact and headers. | `node apps/ai-lab-landing/build.cjs` | Generated `apps/ai-lab-landing/dist/` artifact. |
| Landing test | No-script static artifact contracts. | `node --test apps/ai-lab-landing/tests/build.test.cjs` | Node test output. |
| Local package test | Windows package metadata and release verification. | `node --test apps/local-ai-agents-lab/tests/build-release.test.cjs` | Node test output. |
| Local server tests | Loopback server, SQLite behavior, fixed-provider discovery/routing, and local data behavior. | `py -3 -m unittest discover -s apps/local-ai-agents-lab/tests` | Python test output. |
| Local training tests | JSONL validation, local path restrictions, CPU selection, and unsupported CUDA handling. | `py -3 -m unittest discover -s apps/local-ai-agents-lab/tests` | Python test output. |
| Local model downloader | Validate only local Ollama downloads and explicit model IDs; assert deterministic mocked progress, failure and concurrent-job handling. | `py -3 -m unittest discover -s apps/local-ai-agents-lab/tests` | `tests/test_model_install.py` output; real pull remains manual. |
| Local update check | Validate the fixed official endpoint, bounded safe response, validated external links, and no automatic installation behavior. | `py -3 -m unittest discover -s apps/local-ai-agents-lab/tests` | `tests/test_updates.py` and shell/package test output. |
| Foundation validation | Pinned adoption asset integrity and bounded secret scan. | `node scripts/validate-foundations.cjs` | Validator output. |

## Manual checks

- Confirm the Local Lab starts only on `127.0.0.1:8765` and calls only its fixed loopback provider endpoints: Ollama `11434`, LM Studio `1234`, or vLLM `8000`.
- Before an approved Pages deployment, inspect the preview for responsive layout, keyboard navigation, HTTPS, headers, and absence of local-Lab routes.
- Before releasing a Windows package, verify its generated build ID and preserve the existing local SQLite data during upgrade.
- Press **Check for updates** once with network access and confirm it reports the release or a non-destructive error; it must not download or alter files.
- Run a controlled CUDA training job only on a supported local GPU; mocked checks do not prove actual CUDA training.

No production deployment, release publication, or external browser test is implied by these commands.
