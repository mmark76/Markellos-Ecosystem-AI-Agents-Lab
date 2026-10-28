# AI Agents Lab public landing page

This is a static Cloudflare Pages landing page for `ai-lab.markellosecosystem.com`. It describes how to run the local-only AI Agents Lab; it does not host the application, an LLM, chat input, accounts, or Local Lab data. It uses the central cookie-less aggregate analytics collector only on the production hostname.

Its dashboard shell follows the Ecosystem Framework visual structure: project identity, explicit STABLE and BETA labels on the two owner-approved featured downloads (not the logo), a compact ChatGPT Advisor eligibility note instead of redundant single-page anchor navigation, ecosystem return path, responsive content cards, and a two-line footer with the generated build identity. It stores only validated local appearance preferences.

Two permanently visible download buttons point to the independently checksum-verified v2.0.26 GitHub release (**CURRENT STABLE**) and v2.0.29 GitHub release (**CURRENT BETA**, with separate Start Local Server/Open AI Lab BATs, background startup, in-app View API Logs, and optional training-setup result popup). The owner's distribution labels are not defect-free guarantees. The v2.0.16 Cloudflare R2 milestone (**PREVIOUS STABLE**), v2.0.28 and v2.0.27 GitHub ZIPs, and other archived releases remain accessible in the collapsed Release archive. The responsive layout stacks STABLE and BETA on narrow screens. The public page does not create or distribute the Windows ZIP itself.

**Release archive:** It separates **Milestones · Cloudflare R2**, **Earlier Cloudflare R2 releases**, and **Releases · GitHub**, so historical ZIPs remain accessible and correctly identified. The original `release-distribution.json` remains the read-only registry of verified historical R2 ZIP URLs and SHA-256 hashes. The independent, legacy-named `github-beta-releases.json` provides a checksum-verified offline snapshot of GitHub-only releases. Explicit `release-channels.json` pins, not list order, select CURRENT STABLE and CURRENT BETA. The build rejects duplicate versions across either registry and invalid checksums.

When a visitor explicitly opens Release archive, `src/github-release-archive.js` fetches published GitHub Release metadata and lists every GitHub-only Windows ZIP with a valid SHA-256, excluding the versions already represented in R2. The refresh handles paginated releases and uses safe DOM text nodes and verified GitHub URL patterns. It does **not** contact the GitHub API during normal page load; the site's `_headers` CSP permits `https://api.github.com` only in `connect-src`. If the API is unavailable the verified build-time snapshot remains with a link to the complete GitHub Releases page. The CURRENT STABLE button is updated only with a separately checked release, SHA-256, and owner-approved designation.

The site states that Ollama is the only supported inference provider, the Conference Room is available from v1.1.6, optional advanced model fine-tuning is not yet operational because of a confirmed training-worker compatibility issue, and the Local App has no in-app manual update check. The landing build reads `apps/local-ai-agents-lab/VERSION` only for its build identity.

## Analytics and consent

The landing page does not use analytics cookies, consent persistence, events, identifiers, page paths, referrers, device data, or download tracking. The central collector retains only aggregate visit counts by UTC hour, domain, and transient country, solely so the administrator can understand overall traffic. It never receives Local Lab conversations, prompts, model data, names, email addresses, or other sensitive personal information.

## Detailed application description

The public dashboard places a **Detailed App Description** link immediately after **README / Installation Guide**. It opens `app-description.html`, which explains the five active workspaces, fifteen agent roles, Ollama model selection, local history, privacy, optional ChatGPT/RunPod connections, and the current fine-tuning limitations. The installation guide links to the same overview.

The landing build injects the owner-approved current STABLE and BETA GitHub versions and the local source build identity into the dashboard, installation guide, and overview. It does not create or publish a Windows ZIP. The previous STABLE R2 version comes from the reviewed `release-distribution.json` entry for the archive and Technical README; both featured GitHub releases come from the separately verified `github-beta-releases.json` entries, each with its own ZIP URL and checksum. Do not change a public stability designation without owner approval and verification.

## Technical README (existing guide link)

The **README / Installation Guide** (`src/simple-guide.html`) already links to `./README.md` as the **public technical README**. That published Markdown artifact is generated from `src/PUBLIC_DOCUMENTATION.md` by `build.cjs`; it is not a new landing-page button or a separate HTML page. Its software compatibility matrix, local/offline architecture, five Lab workflows, optional ChatGPT and RunPod boundaries, locked fine-tuning stack, supported Windows requirements, and source references describe verified source capabilities and known limitations.

The build injects **independent version values** for the current Local Lab source and the previous STABLE R2 milestone into the generated Technical README. GitHub releases remain separately verified and listed. Edit the Markdown source, not the generated `dist/README.md`. The landing build regression checks its existing guide link, version injection, and required compatibility sections.

## Installation guidance

The highlighted notice directly below the title names the correct first-setup BAT for each pinned ZIP: `Start AI Training Lab.bat` for STABLE v2.0.26 and `Start Local Server.bat` for BETA v2.0.29. The BETA folder also includes `Open AI Lab.bat`, which opens the browser and starts the server if needed. The download buttons explicitly distinguish STABLE and BETA. The left **Stop Local Server** action invokes the dedicated per-user stop-only handler, with confirmation before terminating a recognized Lab process; it never restarts the server or stops Ollama. The right **Open AI Lab** action opens or starts the Lab as needed. Both require initial setup in the chosen extracted folder.

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
