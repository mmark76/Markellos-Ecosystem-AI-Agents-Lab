# Cloudflare Deployment Record — AI Agents Lab landing page

## Approved scope

- Scope: `AI-LAB-SCOPE-001`
- Owner: Markellos Ecosystem repository maintainer
- Approval: direct user request, 2026-10-09
- Profile: `DEPLOYED_SERVICE`

## Deployment configuration

- Provider: Cloudflare Pages
- Project name: `ai-lab`
- Production branch: `main`
- Build command: `node apps/ai-lab-landing/build.cjs`
- Output directory: `apps/ai-lab-landing/dist`
- Public hostname: `ai-lab.markellosecosystem.com`
- Preview: use the Cloudflare Pages preview deployment before production.

## Trust boundary

Pages serves a static guide only. It must never proxy, tunnel, or route to the local Lab, Ollama, or SQLite. The artifact has no scripts, forms, API endpoints, analytics, accounts, or data collection. Cloudflare manages HTTPS and the custom-domain DNS record through the Pages custom-domain flow.

## Release and rollback

1. Run the build test and inspect the generated artifact.
2. Confirm the Pages project build command and output directory exactly match this record.
3. Assign `ai-lab.markellosecosystem.com` through the Pages custom-domain UI and allow Cloudflare to manage its DNS record.
4. Verify the preview and production hostname over HTTPS, including the security headers and the absence of application endpoints.
5. If verification fails, roll back to the previous verified Pages deployment. Do not redirect the hostname to the local Lab.

## Evidence status

- Source build and static security controls: verified locally on 2026-10-09.
- Cloudflare project creation, custom-domain assignment, certificate issuance, and production verification: pending external deployment.
