# AI Agents Lab public landing page

This is a static Cloudflare Pages landing page for `ai-lab.markellosecosystem.com`. It describes how to run the local-only AI Agents Lab; it does not host the application, an LLM, chat input, analytics, accounts, or user data.

The primary download link points to the latest public GitHub Release asset, `AI-Agents-Lab-Windows.zip`. A release publication builds the package from the immutable release tag, verifies its build identity, and uploads the ZIP automatically.

## Installation guidance

The landing page links only to the official download pages for the required Windows prerequisites:

- [Python 3.9+](https://www.python.org/downloads/windows/)
- [Ollama](https://ollama.com/download/windows), which the Lab requires at `127.0.0.1:11434`

It also links to [LM Studio](https://lmstudio.ai/download) as an optional local-model application. LM Studio is not a prerequisite or a drop-in replacement: this release communicates specifically with Ollama's local API. The guide states that Internet access is needed for tool/model downloads, while the Lab itself uses only its local Ollama connection.

## Build

From the repository root:

```text
node apps/ai-lab-landing/build.cjs
```

Publish only `apps/ai-lab-landing/dist`. The build emits a real Cyprus-time build identity in `vX.Y.Z_YYYYMMDD_HHMM_SHA` form and copies the Cloudflare `_headers` file into the artifact.

## Cloudflare Pages configuration

- Project name: `ai-lab`
- Production branch: `main`
- Build command: `node apps/ai-lab-landing/build.cjs`
- Build output directory: `apps/ai-lab-landing/dist`
- Custom domain: `ai-lab.markellosecosystem.com`

Before assigning the hostname, confirm that the `markellosecosystem.com` zone is active in the intended Cloudflare account. Use the Pages custom-domain workflow so Cloudflare creates and manages the DNS record; do not manually create a competing record. Verify the generated preview URL, HTTPS certificate, security headers, no-script policy, responsive layout, keyboard navigation, and the absence of application endpoints before the production deployment.

## Rollback

Use Cloudflare Pages deployment rollback to return to the previous verified deployment. Do not point the hostname at the local Lab service or publish the local Lab's data directory.
