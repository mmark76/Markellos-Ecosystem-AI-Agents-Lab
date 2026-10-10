# Security Plan

## System Risk Profile
- Selected Shield revision / baseline: `d684570fb240fc5a84ff175fe6c16daabbbfdaa4`; public static-site controls.
- Exposure: public HTTPS information page.
- Criticality: low; availability and accurate privacy boundary matter.
- Data sensitivity: no user or Lab data is collected or processed.
- Main threat actors: opportunistic web attackers, content tampering attempts, and users mistaking the page for a hosted Lab.
- Regulatory context: no intended personal-data processing.

## Security Owners
- Product risk, security, incident, and data/privacy owner: Markellos Ecosystem repository maintainer.

## Required Controls

> **Initialization instruction:** Replace or remove every `EXAMPLE-*` row. It is
> not an approved control and cannot satisfy a security requirement.

| Control ID | Control | Requirement ID | Owner | Verification | Evidence | Status |
|---|---|---|---|---|---|---|
| AI-LAB-SEC-001 | Static-only artifact: no script, forms, analytics, API, accounts, or user-data storage. | Shield public web controls | Repository maintainer | Inspect generated artifact. | `apps/ai-lab-landing/tests/build.test.cjs` | VERIFIED 2026-10-09 |
| AI-LAB-SEC-002 | Browser security headers restrict sources, framing, referrers, permissions, and content types. | Shield public web controls | Repository maintainer | Inspect generated `_headers` and production headers. | Build test; Cloudflare post-deploy check. | LOCAL VERIFICATION COMPLETE; PRODUCTION PENDING |
| AI-LAB-SEC-003 | The public hostname has no route to the local Lab, Ollama, or SQLite data. | Shield public web controls | Repository maintainer | Confirm Pages artifact and production routes. | Artifact review; Cloudflare post-deploy check. | PENDING |

For each applicable Shield requirement, retain its authoritative requirement/control ID, source revision, project control mapping, verification, sanitized evidence location, and status. `NOT_APPLICABLE` and exceptions require rationale, owner, approval, and review/expiry details.

## Areas to Address
- Identity and access
- Authentication
- Authorization
- Sessions and tokens
- Input and output handling
- Browser security
- API security
- Data protection
- Secrets and keys
- Infrastructure and network
- Dependencies and supply chain
- Logging and detection
- Incident response
- Backup and recovery
- Privacy
- Vulnerability management
