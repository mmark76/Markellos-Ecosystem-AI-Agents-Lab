# AI Agents Lab public landing page

This is a static Cloudflare Pages landing page for `ai-lab.markellosecosystem.com`. It describes how to run the local-only AI Agents Lab; it does not host the application, an LLM, chat input, accounts, or Local Lab data. It optionally loads GA4 only after a visitor explicitly accepts analytics.

Its dashboard shell follows the Ecosystem Framework visual structure: project identity, visible BETA designation, a compact ChatGPT Advisor eligibility note instead of redundant single-page anchor navigation, ecosystem return path, responsive content cards, and a two-line footer with the generated build identity. It stores only validated local appearance preferences.

The landing page reports the current publicly downloadable state truthfully. Its prominent official ZIP download button uses the last verified Cloudflare R2 BETA distribution URL. The separate GitHub button may link to a newer, checksum-verified BETA ZIP (currently v2.0.17) and is explicitly labelled with its distinct version; the GitHub BETA does not change the R2 primary release or archive. `release-distribution.json` is the reviewed source of the ordered public release archive from v1.0.0 onward, including each version, URL, and SHA-256 checksum; the build rejects malformed metadata, duplicate versions, or an empty archive. The current ZIP stays prominent and earlier ZIPs are kept in a compact, collapsed archive for reference and future agent studies. This deliberately lets a Pages build continue to show the last verified public ZIP while a newer Local App release is being prepared. The page also states that Ollama is the only supported inference provider, the Conference Room is available from v1.1.6, optional advanced model fine-tuning is not yet operational because of a confirmed training-worker compatibility issue, and the Local App has no in-app manual update check. The landing build reads `apps/local-ai-agents-lab/VERSION` only for its build identity.

## Analytics and consent

The landing page uses GA4 property `G-ZEPZK1T1YQ` for page views, hash navigation, traffic-source and geographic reporting supplied by GA4, and the non-sensitive `zip_download` event. It does not load Google's tag or make a Google request before consent. Accepting analytics dynamically loads the tag once; Reject and withdrawal disable future analytics events. The implementation uses Consent Mode v2 signals, stores only the visitor's choice in local storage, and never sends Local Lab conversations, prompts, model data, or sensitive personal information.

## Detailed application description

The public dashboard places a **Detailed App Description** link immediately after **README / Installation Guide**. It opens `app-description.html`, which explains the five active workspaces, fifteen agent roles, Ollama model selection, local history, privacy, optional ChatGPT/RunPod connections, and the current fine-tuning limitations. The installation guide links to the same overview.

The landing build injects the confirmed current release version and build identity into the dashboard, installation guide, and overview. It does not create or publish a Windows ZIP. The displayed download version comes only from the reviewed `release-distribution.json` entry, including the verified release URL and checksum. Do not claim a newly announced version until that distribution entry is available.

## Installation guidance

The landing page links only to the official download pages for the required Windows prerequisites:

- [Python 3.9+](https://www.python.org/downloads/windows/)
- [Ollama](https://ollama.com/download/windows), which the Lab requires at `127.0.0.1:11434`

LM Studio and vLLM are not supported inference providers for this release. The guide states that Internet access is needed for authorized tool/model downloads, while the Lab itself uses only its local Ollama connection.

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
