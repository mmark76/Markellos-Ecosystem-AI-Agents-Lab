# Ecosystem Security — The Shield

The horizontal security authority for the Markellos Ecosystem.

## Mission

`Ecosystem-Security-The-Shield` defines, documents, and evolves the security architecture, controls, standards, and governance used across the Markellos Ecosystem.

Its purpose is not only to protect current services, but to establish reusable security patterns before the ecosystem expands into higher-risk capabilities such as AI assistants, APIs, payments, user accounts, and sensitive data processing.

## Role in the Ecosystem

```text
Ecosystem Control — The Brain
  -> observes, coordinates, and presents ecosystem state

Ecosystem Security — The Shield
  -> defines security rules, standards, reusable baselines,
     assurance semantics, and evidence requirements

Applications, services, and infrastructure
  -> implement applicable controls and retain populated configuration,
     runtime state, application-specific risks, and operational evidence
```

Security remains a responsibility of every project. The Shield owns the shared
security model; it does not duplicate the Ecosystem's canonical inventory or
take operational ownership from application, service, or infrastructure teams.

## Complete Capability Model

The [Shield capability catalogue](docs/security-capability-model.md) presents the
full intended landscape at a glance across `GOVERN`, `IDENTIFY`, `PROTECT`,
`DETECT`, `RESPOND`, and `RECOVER & ASSURE`. Each capability states its purpose,
scope, maturity, availability, expected policies, standards, controls, evidence,
dependencies, roadmap phase, and possible future automation.

The canonical source is the machine-readable
[`model/security-capabilities.json`](model/security-capabilities.json), governed
by [`schemas/security-capability.schema.json`](schemas/security-capability.schema.json).
The [architecture guide](docs/security-capability-architecture.md) explains
ownership, cross-Ecosystem boundaries, controls and evidence, Strong Room,
progressive adoption, and future automation.

Current maturity is intentionally explicit:

- `PLANNED` means roadmap architecture only.
- `FOUNDATION` means structure or requirements exist, not an operational service.
- `PARTIAL` means only a bounded subset exists.
- `IMPLEMENTED` means a maintained Shield-owned capability exists for its stated
  scope; it does not prove ecosystem-wide adoption.
- `VERIFIED` requires current, scoped, attributable evidence and is never inferred
  from documentation.

## Security Principles

1. **Defense in depth** — no critical asset should depend on one control alone.
2. **Zero Trust** — identity, device, service, and request context must be verified explicitly where risk requires it.
3. **Least privilege** — users, services, tokens, and infrastructure receive only the permissions they require.
4. **No public origin by default** — private services should not expose unnecessary direct network paths.
5. **Strong authentication** — use MFA, passkeys, or equivalent modern controls according to risk.
6. **Secrets stay secret** — passwords, API keys, tokens, private keys, OTP seeds, recovery material, and authentication secrets must never be committed to Git.
7. **Secure-by-design** — security requirements and trust boundaries are considered before implementation, not only after deployment.
8. **Fail closed** — failed or uncertain security checks should block exposure rather than silently reduce protection.
9. **Verify, do not assume** — security claims require evidence.
10. **Contain and recover** — prevention is only one layer; detection, containment, rollback, backup, and recovery are equally important.

## Relationship to Project Security

This repository should hold shared or ecosystem-wide security decisions, such as common authentication standards, minimum MFA requirements, approved network exposure patterns, secrets-management rules, incident-response structure, and security classification/risk methodology.

Project repositories should continue to hold implementation-specific material
such as exact deployment configuration, project-specific threat models,
application authorization rules, runtime evidence, rollback procedures, and
project-specific security exceptions. The Shield may define schemas and consume
sanitized references; it does not become a vault or evidence dumping ground.

## External runtime evidence

Host-specific Hetzner runtime mapping and dated audit evidence are maintained in [About Hetzner](https://github.com/mmark76/About-Hetzner). The [2026-09-19 verified baseline](https://github.com/mmark76/About-Hetzner/blob/main/baselines/2026-09-19-verified-baseline.md) is an external evidence source for security assessment; it does not replace Shield policy, controls, or project-specific verification.

## Current Status

`EARLY FOUNDATION — STRONG ROOM v1 IS THE ONLY IMPLEMENTED REUSABLE CAPABILITY`

[Strong Room v1](standards/private-app-security-baseline/README.md) is the first concrete reusable baseline for private applications: Access and MFA, Tunnel JWT validation, private origin isolation, hardened containers, release integrity, rollback and evidence-based acceptance.

Start with the [standard](standards/private-app-security-baseline/README.md), [parameterized templates](templates/strong-room/README.md), [verification checks](checks/strong-room/README.md), and [Control reference implementation](reference-implementations/ecosystem-control.md). Security owns the shared baseline; each application retains its actual configuration, implementation, threat model and deployment evidence. A template does not secure a deployment without independent configuration and verification.

[Monitoring](monitoring/README.md) and [external alerts](alerts/README.md) define
foundation architecture only. IAM, centralized secrets, SIEM, universal
vulnerability scanning, incident automation, complete threat models, compliance,
and ecosystem-wide verification are not claimed.

## Controls, Evidence, and Production Authority

The repository includes foundation schemas for
[security controls](schemas/security-control.schema.json),
[evidence items](schemas/evidence-item.schema.json), and
[security exceptions](schemas/security-exception.schema.json). Assessment starts
from `NOT TESTED`; absence of evidence is never `PASS`. Declared configuration,
observed configuration, and verified evidence remain distinct.

> **technical validation != authorization**

A human approval gate is required immediately before every production-impacting
change. Tests, CI, automation, agents, and AI recommendations may provide
evidence, but they never grant production authority.

## Validate the Repository

Use a supported Node.js runtime (currently tested with Node 24):

```text
node scripts/render-capability-catalog.cjs --check
node --test tests/*.test.cjs
```

Change the canonical registry, not the generated catalogue. Run
`node scripts/render-capability-catalog.cjs` after an intentional model change.
The upstream capability-model validation record is intentionally excluded from
this template because it is dated operational evidence. The local
[`FOUNDATION_SOURCES.md`](../../FOUNDATION_SOURCES.md) records the import scope
and verification limits instead.

## Repository Safety Rule

This repository is documentation and policy infrastructure, **not a credential vault**.

Never commit passwords, API keys, tokens, private SSH keys, TOTP seeds or enrollment QR codes, recovery codes, session cookies, payment secrets, populated `.env` files, or other authentication/encryption secrets.

Store only non-secret architecture, policy, metadata, procedures, and evidence suitable for version control.
