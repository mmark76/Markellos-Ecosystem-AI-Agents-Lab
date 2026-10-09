# Threat boundaries

| Boundary / threat | Required controls | Residual risk and application responsibility |
| --- | --- | --- |
| Internet -> Access: unapproved identity or policy bypass | SR-01, SR-02, SR-08 | Account takeover, mailbox compromise, recovery abuse and provider-admin mistakes; choose factors for risk and test denial. |
| Edge -> connector: forged, stale or another app's JWT | SR-03 | A compromised provider/connector is trusted infrastructure; validate effective audience, issuer and signature, not client-side claims. |
| External network -> origin: IPv4/IPv6, NAT, proxy or alternate-host bypass | SR-04, SR-08 | Loopback is reachable by host processes; host-root/privileged attackers can bypass this layer. Firewall summaries alone do not prove Docker isolation. |
| Shared host -> container: unwanted network, mounts or privilege | SR-05 | Dedicated bridge isolation is not a universal egress firewall. Inspect daemon routing, host gateways, connected peers and capabilities. |
| Source/build -> served files: artifact replacement or accidental repository publication | SR-06, SR-07 | A hash stored beside attacker-controlled files provides consistency, not authenticity. Trust the reviewed build and independently retained manifest digest. |
| Browser -> application: XSS, authorization, cache or session leaks | SR-08, SR-09 | Access is admission control. APIs still need object/action authorization, CSRF/input defenses, tenant isolation and data protection appropriate to the app. |
| Operator -> provider/runtime: misconfiguration and privileged misuse | SR-10, SR-11 | Least-privilege administration, change review, recovery and auditability remain operational responsibilities. |
| Monitoring -> incident response: silent failure or Control outage | SR-11 | External alert delivery and monitoring health must work independently of Control. |

Applications must add their own assets, actors, data classification, abuse cases,
entry points, dependencies, recovery limits and risk acceptance. This baseline
does not cover payments, business logic or arbitrary backend security by itself.

No universal "no bypass" claim is permitted from a finite probe list. Report the
tested paths, vantage points, IP families, timestamps and unresolved gaps.
