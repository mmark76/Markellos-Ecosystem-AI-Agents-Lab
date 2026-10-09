# Security monitoring — next phase

Architecture requirements only; no collector, service, schedule or production
integration is implemented by Strong Room v1.

Security owns detection rules and coverage expectations. Applications and
operators own the configured sources and sensitive evidence. Establish read-only,
least-privilege collection with explicit retention and redaction.

Required future coverage:

- Access policy, identity scope, MFA configuration and recovery changes.
- Tunnel routes, connector identity, availability and configuration changes.
- DNS records that introduce direct/alternate exposure.
- Unexpected public listeners, IPv4/IPv6 routing and firewall changes.
- Reverse-proxy routes, labels and network attachments.
- SSH access, privilege escalation and privileged administration.
- Container/image/mount/capability/configuration drift.
- Artifact and served-release integrity.
- Monitoring health itself: missed collection, stale data, permission failures,
  delivery failures and missing heartbeats.

Each detection needs owner, severity, observed/expected state, source timestamp,
freshness limit, scoped evidence, response procedure and a tested delivery path.
No signal must be treated as healthy when collection fails.

```text
Security detects -> external alert -> Control displays/tracks incident
```

See [alert requirements](../alerts/README.md). The next phase is Security monitoring
and alerts across both the ecosystem perimeter and internal systems.
