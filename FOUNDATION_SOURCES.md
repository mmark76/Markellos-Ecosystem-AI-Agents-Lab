# Foundation Sources and Inclusion Policy

This template is an adoption package, not a fifth canonical foundation. The source URLs and revisions assessed for this release are in `FOUNDATION_VERSIONS`.

## Inclusion decisions

| Foundation | Included project-safe material | Reference-only upstream material |
|---|---|---|
| DNA | Lifecycle workflow, gates, project documentation, evidence and completion templates, and UI/UX starter assets. | The upstream Framework remains authoritative for its operating model and future evolution. |
| Engineering Standards | `ENG-*` applicability records plus a pinned, sanitized catalogue snapshot in `foundations/engineering-standards/`. | Upstream requirements remain normative; local content is a versioned adoption aid, not a replacement authority. |
| Shield | Project-owned security-plan, threat-model, risk, exception, and verification entry points plus the reviewed, sanitized Strong Room templates, checks, schemas, and capability model in `foundations/shield/`. | Populated configurations, credentials, identities, endpoints, private operational evidence, and dated validation records. |
| Infrastructure | Infrastructure profile, readiness gate, project-owned integration records, and sanitized boundary guidance in `foundations/infrastructure/`. | Host evidence, live runtime state, credentials, and project-specific deployment configuration. |

## Safety and ownership rules

- The vendored Foundation snapshot is pinned to the reviewed DNA revision in `FOUNDATION_VERSIONS`; run `node scripts/validate-foundations.cjs` and the Foundation tests before changing it.
- Do not copy further private Shield material into a repository until the target visibility and the material's distribution classification are explicitly approved.
- Never store secrets, populated environment files, production identities, host-specific sensitive data, or private operational evidence here.
- Projects may copy or instantiate an upstream reusable asset only when its owner, license, revision, applicability, and verification obligations are recorded.
- Conflicts are not silently reconciled: Engineering Standards decide engineering requirements; Shield decides security requirements; Infrastructure decides shared infrastructure mechanisms; DNA decides lifecycle adoption. Record the conflict and seek the owning foundation's decision.
