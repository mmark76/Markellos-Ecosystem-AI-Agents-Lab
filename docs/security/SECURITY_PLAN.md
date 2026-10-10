# Security Plan

## System Risk Profile

- Selected Shield revision / baseline: `d684570fb240fc5a84ff175fe6c16daabbbfdaa4`; public static-site controls.
- Exposure: public static HTTPS guide and a separate owner-controlled local Lab.
- Criticality: low; accurate public/local separation and private local conversation handling matter.
- Data sensitivity: the public page processes no user or Lab data; the Local Lab stores private local SQLite conversation history.
- Main threat actors: opportunistic web attackers, content tampering attempts, users mistaking the page for a hosted Lab, and people with local-device access.
- Regulatory context: no intended public personal-data processing.

## Security Owners

- Product risk, security, incident, and data/privacy owner: Markellos Ecosystem repository maintainer.

## Required Controls

| Control ID | Control | Requirement ID | Owner | Verification | Evidence | Status |
|---|---|---|---|---|---|---|
| AI-LAB-SEC-001 | Static-only artifact: no script, forms, analytics, API, accounts, or user-data storage. | Shield public web controls | Repository maintainer | Inspect generated artifact. | `apps/ai-lab-landing/tests/build.test.cjs` | VERIFIED 2026-10-09 |
| AI-LAB-SEC-002 | Browser security headers restrict sources, framing, referrers, permissions, and content types. | Shield public web controls | Repository maintainer | Inspect generated `_headers` and production headers. | Build test; Cloudflare post-deploy check. | LOCAL VERIFICATION COMPLETE; PRODUCTION PENDING |
| AI-LAB-SEC-003 | The public hostname has no route to the Local Lab, Ollama, or SQLite data. | Shield public web controls | Confirm Pages artifact and production routes. | Artifact review; Cloudflare post-deploy check. | PENDING EXTERNAL DEPLOYMENT |
| AI-LAB-SEC-004 | The Local Lab uses only loopback Ollama and excludes its database, models, and logs from Git. | Local application boundary | Inspect source, `.gitignore`, and local behavior. | Local Lab guide and tests. | LOCAL VERIFICATION PENDING |

No production security claim is implied while Pages deployment verification remains pending. Do not commit credentials, model files, local SQLite data, populated configuration, or private operational evidence.
