# Verify the security boundary

Read-only/manual procedure for SR-01–SR-11. Use the
[acceptance table](../../standards/private-app-security-baseline/acceptance-criteria.md)
as the per-deployment evidence record. Never disable production controls to test them.

| Step | Method and expected result |
| --- | --- |
| Identity and MFA | Save/reopen effective app/policy/organization configuration and verify exact host and identity scope. In a fresh browser the approved identity completes required factors; unapproved identity and missing/incorrect MFA cannot reach private content. Confirm a subsequent login follows configured MFA frequency. |
| JWT boundary | Verify saved connector enforcement and exact audience. In an authorized isolated validator harness exercise absent, malformed, expired, wrong-issuer, wrong-audience and valid JWT cases. Keep real tokens out of command history/logs/fixtures. If no safe harness exists, mark isolated tests NOT TESTED/BLOCKED and retain configuration/edge evidence at its actual scope. |
| Local origin | Verify effective loopback mapping and Host-aware GET/HEAD health, denied unsupported methods, root/assets/data/unknown paths and appropriate headers. A container healthcheck does not prove host reachability. |
| Container | Run metadata helper, then inspect actual process UID, effective capabilities and NoNewPrivs; prove denied writes to root/config/content in a disposable equivalent runtime, bounded writable temp, exact network peers/options and image provenance. Production evidence may use approved non-mutating inspection; do not write test files to private production data. |
| Artifact | Run the verifier with trusted manifest digest and expected source/app/version. Inspect active bind mount source and compare each served runtime file's size/hash to the manifest. Account for internal-only error files separately. Do not use a served manifest as its own independent trust anchor. |
| Anonymous production | Fresh requests without cookies/credentials to root, JS/CSS/assets, private data, manifest, health and alternate private paths are intercepted without private content. Identify the Access destination or denial, not just an HTTP status. Do not record redirect query strings or response secrets. |
| Authorized production | Required login reaches the correct build and representative content/assets/health with valid TLS. Static source tests and anonymous redirects do not prove this. |
| Bypass | Complete the public-port procedure for direct IP, proxy ports, alternate hosts and IPv4/IPv6; record unavailable vantage points. |
| Logout | Activate the same-origin Access logout link. After the documented revocation interval, reopen protected content and require authentication. Record browser cache/back behavior and cross-app/IdP scope limits. |
| Rollback/regression | Verify previous release and configuration, scoped rollback/recreation and unrelated services/routes. Retain dated rehearsal evidence; do not execute unapproved production rollback. |

Preserve sources separately from interpretations. "Invalid JWT redirected at the
edge" does not prove the connector rejected a wrong-audience JWT. Observing an
enrolled authenticator does not prove MFA was required on a new login.

Every result starts NOT TESTED and changes only with evidence. Missing tool,
permissions or safe harness yields BLOCKED; missing technical capability yields
TECHNICALLY UNAVAILABLE with supporting evidence. Neither is a passing gate.
