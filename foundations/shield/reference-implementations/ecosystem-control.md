# Ecosystem Control — Reference Implementation — Strong Room v1

Control is the first reference implementation. Security owns the reusable
baseline; Control owns its actual implementation, configuration and deployment
evidence. Future applications may implement equivalent controls differently if
they satisfy the baseline and its acceptance criteria.

## Audit scope and evidence precedence

Audit date: 2026-09-05. Both repositories were freshly cloned and fetched from
main, with clean synchronized checkouts:

- Control source: `67da19178503c3b3416cc3638f28e63e143fc889`.
- Security starting base: `763b63a2f2b4588924ddac67964216f4693cd77d`; README only,
  no existing validation, nested instructions or competing baseline structure.

The fetched
[roadmap](https://github.com/mmark76/ecosystem-control/blob/67da19178503c3b3416cc3638f28e63e143fc889/docs/product/PRODUCT_ROADMAP.md)
and [execution plan](https://github.com/mmark76/ecosystem-control/blob/67da19178503c3b3416cc3638f28e63e143fc889/docs/operations/CURRENT_EXECUTION_PLAN.md)
still record rollback/incomplete delivery, human review and unknown provider state.
The [authentication decision](https://github.com/mmark76/ecosystem-control/blob/67da19178503c3b3416cc3638f28e63e143fc889/docs/security/CONTROL_ACCESS_AUTHENTICATION.md)
says approved, implementation pending. The owner explicitly identified these
planning/recovery states as stale relative to newer production evidence on
2026-09-05. They remain unchanged in Control.

The audit read the earlier operator-owned `control-deployment-evidence.md` and
`control-sign-out-evidence.md` from the 2026-09-04 deployment task. The owner
identified its newer `control-deployment-evidence(1).md` and supplied the later
results in this task; that exact suffixed file was not independently located.
These external evidence files remain under application/operator ownership.
Ask the Control owner for access; they have not been copied into Security.

Evidence lineage:

- [PR #9](https://github.com/mmark76/ecosystem-control/pull/9), deployed merge
  `a8f8decd5b7c0ae0be035144d05d85be902c5f80`, build
  `v1.0.0_20260904_1640_a8f8dec`: production Access/identity, OTP and independent
  MFA configuration, Tunnel JWT enforcement, origin/container isolation,
  immutable release and served-file integrity evidence.
- Owner follow-up on 2026-09-05: a fresh separate-browser login with the approved
  email completed the required authentication; another email was denied before
  OTP dispatch. These are owner-confirmed observations, not fresh tests by this audit.
- [PR #10](https://github.com/mmark76/ecosystem-control/pull/10), deployed merge
  `15824c590030839c773435ea134f0b86981eb427`, build
  `v1.0.0_20260904_1745_15824c5`: production logout/reopen and anonymous runtime
  path protection, with refreshed runtime integrity and regression evidence.

No new production probes or mutations were made during extraction. The remaining
security verification limitation is **TECHNICALLY UNAVAILABLE: independent
external IPv6 direct-origin probe**. Available listener, edge and same-host IPv6
checks found no bypass, but are not independent external IPv6 proof.

Separate metadata discrepancy: the historical reports and owner note say PR #7
was open/unmerged. Read-only GitHub inspection on 2026-09-05 shows it merged at
2026-09-04 15:16:42 UTC into `67da19178503c3b3416cc3638f28e63e143fc889`.
This audit did not modify, merge, close or otherwise act on PR #7. That later
documentation merge is not claimed as the deployed application revision.

## A — reusable architecture

| Extracted control | Source and demonstrated scope |
| --- | --- |
| Loopback publication, dedicated normal bridge, dropped capabilities, read-only/non-root container, no-new-privileges, bounded resources | [Compose](https://github.com/mmark76/ecosystem-control/blob/67da19178503c3b3416cc3638f28e63e143fc889/deployment/compose.yaml); source implementation and dated local runtime evidence |
| Static serving, GET/HEAD, restrictive headers, minimal health, no-store | [NGINX](https://github.com/mmark76/ecosystem-control/blob/67da19178503c3b3416cc3638f28e63e143fc889/deployment/nginx.conf); source and local checks |
| Exact runtime allowlist, clean build inputs, deterministic package, manifest membership/size/hash verification | [packager](https://github.com/mmark76/ecosystem-control/blob/67da19178503c3b3416cc3638f28e63e143fc889/scripts/package-deployment.cjs), [verifier](https://github.com/mmark76/ecosystem-control/blob/67da19178503c3b3416cc3638f28e63e143fc889/scripts/verify-deployment-artifact.cjs), [18 deployment tests](https://github.com/mmark76/ecosystem-control/blob/67da19178503c3b3416cc3638f28e63e143fc889/tests/deployment-artifact.test.cjs); 18/18 rerun successfully during extraction |
| Access approved identity, Email OTP plus Independent MFA/TOTP each new login | Production settings in the deployment report, supplemented by owner-confirmed fresh allowed login and denied-email test |
| Tunnel JWT validation, Access before exposure, firewall/proxy checks, immutable releases, scoped rollback and production acceptance | [runbook](https://github.com/mmark76/ecosystem-control/blob/67da19178503c3b3416cc3638f28e63e143fc889/docs/operations/PHASE_4B_PRIVATE_DEPLOYMENT_RUNBOOK.md); documented methods, not fresh provider proof |
| Access logout endpoint | [HTML link](https://github.com/mmark76/ecosystem-control/blob/15824c590030839c773435ea134f0b86981eb427/index.html); production report observed Access logout and login required again after reopening |
| Effective Docker bindings plus host HTTP, and careful evidence limits | [recovery evidence](https://github.com/mmark76/ecosystem-control/blob/67da19178503c3b3416cc3638f28e63e143fc889/evidence/phase-4b-2-root-cause-and-recovery.md); dated VPS A/B probe and corrected local runtime validation, explicitly not production acceptance |

The production reports also demonstrate saved/reopened connector enforcement
with the single correct app audience, preserved unrelated routes, effective
loopback binding, no unintended proxy attachment, unchanged firewall, hardened
runtime, local health and exact served hashes. The earlier rollback and the
retained previous release provide recovery evidence. Negative JWT/header probes
at the edge are bounded evidence; they do not independently isolate every token
failure mode at the connector. No blanket certification against all future
baseline acceptance tests is implied.

The generic Tunnel fragment is derived from the documented requirement and
current official provider fields, not a copied live configuration. The new
artifact verifier requires an independently trusted manifest digest and expected
app/source/version; it does not copy Control's runtime allowlist or metadata.

## B — application configuration deliberately excluded

Live/legacy hostnames, ports, application/container/service/network identifiers,
Access application/policy IDs, audiences, approved identities, Tunnel IDs,
server names, paths, runtime image digest, resource budgets, session duration,
timezone, data model, exact runtime allowlist and existing-service inventory stay
with Control. The baseline uses required placeholders and synthetic examples.

## C — operational evidence linked, not copied

Operator transcripts, runtime object IDs, image scan results, dated firewall and
listener snapshots, artifact hashes, screenshots, route inventories, failure and
rollback logs remain in Control. A past zero-finding scan is not a permanent
security property. The audit did not import these records wholesale.

## D — prohibited material

No OTP codes, TOTP seeds, enrollment QR secrets, recovery codes, API/provider
tokens, Tunnel credentials, cookies, JWTs, private keys, passwords or secret
environment values may be copied. Owner email selectors are omitted. Source
review and pattern scans are bounded checks, not a universal secret-free proof.

## Architecture conclusions

Security's mission and ownership model match this task. No ownership redesign is
needed. Newer production evidence and the explicit owner clarification supersede
stale planning status for this extraction, with provenance and limits retained.
Control's static implementation is a narrow profile; new apps need independent
risk decisions and acceptance, particularly for dynamic data and authorization.
