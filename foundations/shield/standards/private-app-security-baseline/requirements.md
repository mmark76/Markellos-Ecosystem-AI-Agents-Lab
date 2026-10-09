# Requirements — Strong Room v1

MUST is mandatory unless a reviewed exception records equivalent protection.
SHOULD requires a documented feasibility/risk decision. Risk-specific settings
belong in the adopting application; no Control production setting is a default.

| ID | Requirement |
| --- | --- |
| SR-01 | MUST create an Access application scoped to the exact protected hostname and all private paths/assets/API routes, with explicit approved identities and default deny. Review overlapping applications, policy precedence, and every Allow, Bypass, and Service Auth path. No undocumented fallback or bypass. |
| SR-02 | MUST define strong authentication and MFA appropriate to the application's risk. The OTP profile MUST combine approved email OTP with independent TOTP MFA; email OTP alone is not MFA. Record effective organization/application/policy settings, permitted factors, session durations, enrollment/recovery and per-login behavior. Higher-risk apps must assess phishing-resistant factors. |
| SR-03 | MUST route only the intended hostname to its application origin, with Access JWT validation at cloudflared or an equivalent trusted gateway. Validate signature, issuer, expected audience, and token lifetime; missing, invalid, expired and wrong-audience tokens must be denied. Never trust a header merely because it exists. Preserve unrelated routes/settings. |
| SR-04 | MUST keep application publication on explicit host loopback where supported; no wildcard host binding or direct public origin without approved equivalent isolation. Audit IPv4, IPv6, Docker NAT/direct routing, firewall rules and alternate hosts/proxies. No attachment to an existing public proxy network by default. |
| SR-05 | MUST use explicit container networks, minimal mounts, dropped ALL capabilities, no privilege escalation, no privileged/host namespace access or Docker socket. SHOULD run non-root and read-only; writable state and root require documented justification. Bound temporary storage/resources; record image provenance and runtime digest. |
| SR-06 | MUST build from an exact reviewed clean source revision using an explicit runtime allowlist. Create an immutable release plus a manifest of source SHA, version, file paths, byte sizes and SHA-256 hashes. Verify full membership, paths, sizes and hashes before transfer, after transfer, and against the running/served release. Store a trusted manifest digest separately from the release. |
| SR-07 | MUST retain a verified previous release and reviewed rollback plan. On first release record rollback-to-unpublished behavior. Repointing a symlink alone does not update an existing Docker bind mount; recreate only the affected service and reverify it. |
| SR-08 | MUST verify local health, production authenticated health/content, anonymous denial, denied identities, MFA enforcement, JWT rejection, logout, and direct-origin/alternate-path checks. Inspect real effective configuration and existing-service regressions. A healthy container or HTTP status alone is insufficient. |
| SR-09 | MUST delegate logout to Access when Access owns authentication; do not invent an application session system. Test fresh private requests after logout and document token revocation delay and IdP session behavior. Prevent inappropriate caching of private content. |
| SR-10 | MUST attach dated, scoped, attributable evidence to each claim using the acceptance status model. Credentials, cookies, JWTs, OTPs, TOTP seeds, QR enrollment and recovery material MUST never enter source, logs, screenshots or test fixtures. |
| SR-11 | MUST record application threat boundaries, residual risks, baseline revision and exception ownership. Changes to identity, routes, listeners, firewall, images, mounts, release integrity or monitoring require review and renewed affected evidence. |

For the static profile, non-root and read-only operation are feasible and required.
Its security headers and GET/HEAD-only policy must be adapted deliberately for
dynamic applications, with security tests for any added capability.
