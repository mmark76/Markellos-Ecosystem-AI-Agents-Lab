# AI Agents Lab public landing page

This is a static Cloudflare Pages landing page for `ai-lab.markellosecosystem.com`. It describes how to run the local-only AI Agents Lab; it does not host the application, an LLM, chat input, accounts, or Local Lab data. It optionally loads GA4 only after a visitor explicitly accepts analytics.

Its dashboard shell follows the Ecosystem Framework visual structure: project identity, a BETA label on the GitHub download button (not the logo), a compact ChatGPT Advisor eligibility note instead of redundant single-page anchor navigation, ecosystem return path, responsive content cards, and a two-line footer with the generated build identity. It stores only validated local appearance preferences.

The four top download buttons are unchanged: the prominent verified R2 milestone (currently v2.0.16), the current checksum-verified GitHub BETA (currently v2.0.19), and two previous R2 milestone buttons (v2.0.15 and v2.0.4). The public page does not create or distribute the Windows ZIP itself.

**Release archive:** It separates **Milestones · Cloudflare R2**, **Earlier Cloudflare R2 releases**, and **BETA releases · GitHub**, so the old R2 ZIPs are not lost or incorrectly labelled as milestones. The original `release-distribution.json` remains the read-only registry of verified historical R2 ZIP URLs and SHA-256 hashes. The independent `github-beta-releases.json` provides a checksum-verified offline fallback for the newest GitHub-only releases; the first entry also sets the top-right BETA button and prevents the button and fallback archive getting out of sync. The build rejects duplicate versions across either registry and invalid checksums.

When a visitor explicitly opens Release archive, `src/github-release-archive.js` fetches published GitHub Release metadata and lists every GitHub-only Windows ZIP with a valid SHA-256, excluding the versions already represented in R2. The refresh handles paginated releases and uses safe DOM text nodes and verified GitHub URL patterns. It does **not** contact the GitHub API during normal page load; the site's `_headers` CSP permits `https://api.github.com` only in `connect-src`. If the API is unavailable the verified build-time snapshot remains with a link to the complete GitHub Releases page. The GitHub BETA button is updated only with a separately checked release and SHA-256.

The site states that Ollama is the only supported inference provider, the Conference Room is available from v1.1.6, optional advanced model fine-tuning is not yet operational because of a confirmed training-worker compatibility issue, and the Local App has no in-app manual update check. The landing build reads `apps/local-ai-agents-lab/VERSION` only for its build identity.

## Analytics and consent

The landing page uses GA4 property `G-ZEPZK1T1YQ` for page views, hash navigation, traffic-source and geographic reporting supplied by GA4, and the non-sensitive `zip_download` event. It does not load Google's tag or make a Google request before consent. Accepting analytics dynamically loads the tag once; Reject and withdrawal disable future analytics events. The implementation uses Consent Mode v2 signals, stores only the visitor's choice in local storage, and never sends Local Lab conversations, prompts, model data, or sensitive personal information.

## Detailed application description

The public dashboard places a **Detailed App Description** link immediately after **README / Installation Guide**. It opens `app-description.html`, which explains the five active workspaces, fifteen agent roles, Ollama model selection, local history, privacy, optional ChatGPT/RunPod connections, and the current fine-tuning limitations. The installation guide links to the same overview.

The landing build injects the confirmed current release version and build identity into the dashboard, installation guide, and overview. It does not create or publish a Windows ZIP. The R2 milestone download version comes from the reviewed `release-distribution.json` entry; the top-right GitHub BETA comes from the separately verified `github-beta-releases.json` entry, each with its source-specific ZIP URL and checksum. Do not claim a new BETA in the button until that GitHub asset has been published and its checksum verified.

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
