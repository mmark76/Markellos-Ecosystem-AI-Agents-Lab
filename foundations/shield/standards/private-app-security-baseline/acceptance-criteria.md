# Deployment acceptance criteria

Each application stores its acceptance record with its own deployment evidence.
Record baseline revision, source SHA, release/manifest digest, image digest,
environment, UTC timestamp, operator/reviewer, command or method, expected and
actual result, and a sanitized evidence reference. Revalidate after relevant
changes; old evidence must retain its date.

| Status | Meaning |
| --- | --- |
| PASS | The scoped expected behavior was actually observed. |
| FAIL | A performed check contradicted its expectation. |
| BLOCKED | A check could not finish because a prerequisite, authorization or access was missing. |
| NOT TESTED | No attempt has been made. |
| TECHNICALLY UNAVAILABLE | The environment lacks the capability; record proof and the coverage impact. This is not PASS. |

Required FAIL, BLOCKED and NOT TESTED rows prevent acceptance.
TECHNICALLY UNAVAILABLE requires an explicit applicability decision or approved
equivalent evidence; lack of IPv6 on the tester is not proof of no IPv6 exposure.
Exceptions remain visible and must meet the standard's ownership/expiry rule.

| Gate | Requirement | Evidence required for PASS |
| --- | --- | --- |
| AC-01 | SR-01 | Saved/reopened exact-host Access configuration; restrictive identities, complete path coverage, overlap/precedence review and no unauthorized fallback. |
| AC-02 | SR-02 | Positive permitted login, negative unapproved identity, incomplete/incorrect second factor denied, effective MFA and session settings verified. OTP profile: independent TOTP required on each new login. |
| AC-03 | SR-03 | Saved connector JWT enforcement and correct app audience; missing/malformed/expired/wrong-audience token rejection at the validator, plus valid authorized traffic. Edge denial alone does not test the connector. |
| AC-04 | SR-04 | Requested and effective Docker binding agree, host-local HTTP works, IPv4/IPv6 listener and Docker NAT/routing evidence reviewed, public direct-port and alternate-proxy paths cannot serve private content. |
| AC-05 | SR-05 | Exact reviewed image/platform, fresh vulnerability review, actual process UID/capabilities/NoNewPrivs, read-only root and mount behavior, limits and dedicated network membership verified. |
| AC-06 | SR-06 | Clean source and runtime allowlist, separately trusted manifest digest, exact membership/size/hashes before/after transfer and against actual mounts and served content. |
| AC-07 | SR-07 | Previous release and its configuration retained and verified; scoped rollback rehearsal (or first-release unpublish rehearsal) and post-rollback checks. |
| AC-08 | SR-08 | Local health, authenticated production health/content/asset tests, anonymous private-path denial, host/proxy/IP-family bypass matrix and unchanged unrelated services/routes. |
| AC-09 | SR-09 | Access logout reached; subsequent fresh private requests and cached/back navigation assessed after documented revocation window; required login/MFA repeats. |
| AC-10 | SR-10, SR-11 | Sanitized evidence, threat model, adopted baseline revision, explicit gap/exception decisions, reviewer acceptance. |

Use [security-boundary procedure](../../checks/strong-room/verify-security-boundary.md)
and [public-port procedure](../../checks/strong-room/verify-no-public-port.md).
Automated helper PASS results cover only their stated predicates. They cannot
sign off this table or convert source tests into production evidence.
