# Sanitized Infrastructure Foundation Guide

**Upstream:** `mmark76/ecosystem-infrastructure` at the revision pinned in
[`../../FOUNDATION_VERSIONS`](../../FOUNDATION_VERSIONS).

The pinned upstream repository establishes the shared Infrastructure domain and
its ownership boundaries. At the imported revision it contains no reusable
runtime code, infrastructure-as-code modules, scripts, assets, or configuration
templates. This guide retains the reusable boundary and adoption guidance while
excluding host-specific baseline references and production evidence.

## Reusable infrastructure responsibilities

Infrastructure owns shared hosting, runtime, networking, deployment, recovery,
and operational mechanisms when they apply across projects. Typical reusable
mechanisms include private-origin deployment patterns, container networking,
reverse-proxy or tunnel integration, bootstrap procedures, backup/restore
mechanisms, infrastructure-as-code modules, and deployment verification tools.

Applications retain application-specific behavior, data models, authorization,
and project configuration. Infrastructure never owns credentials, populated
environment files, private keys, provider secrets, or a project’s live
operational state.

## Adoption boundary

Security sets the required controls; Infrastructure implements reusable
mechanisms that satisfy them. The DNA governs the project lifecycle, review,
evidence, and completion gates. A project must supply and protect its own real
environment values, obtain separate authorization for any provider or runtime
change, prepare rollback, then verify actual state.

No material in this directory authorizes deployment, DNS, firewall, provider,
or server changes.
