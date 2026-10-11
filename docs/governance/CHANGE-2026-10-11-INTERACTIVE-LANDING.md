# Change Record: Interactive public landing shell

- Change ID: `AI-LAB-CHG-005`
- Requested and approved by: Repository maintainer, 2026-10-11
- Classification: `SCOPE_INCREASE`
- Affected objective: `AI-LAB-OBJ-005`
- Change: Adopt the interactive dashboard shell from `mmark76/integrated-project-template` at `c73d16c` for the public AI Agents Lab guide.
- Boundary: The browser script may store only validated appearance preferences under one namespaced local-storage key. It makes no network requests; the CSP retains `connect-src 'none'`.
- Exclusions: No public Local Lab route, model endpoint, user-content storage, analytics, account, credential, or remote inference integration.
- Verification: build/source tests, security-header inspection, and deployment preview before any production claim.
