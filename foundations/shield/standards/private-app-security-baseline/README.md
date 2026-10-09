# Strong Room v1 — private application security baseline

Security — The Shield owns this versioned standard, reusable patterns, monitoring
and detection requirements, verification requirements, and threat governance.
Each application owns its implementation, configuration, identities, deployment,
threat model, exceptions, and acceptance evidence.

Strong Room is a baseline for private HTTP applications. It is not a deployment
service, an authentication library, or a claim that an application is secure.
Ecosystem Control is the first reference implementation. Its source, production
evidence and owner-confirmed follow-up demonstrate the controls described in the
[reference audit](../../reference-implementations/ecosystem-control.md), with an
explicit limitation on independent external IPv6 direct-origin verification.

Read in order:

1. [Requirements](requirements.md), [architecture](architecture.md), and [threat boundaries](threat-boundaries.md).
2. [Templates and parameters](../../templates/strong-room/README.md).
3. [Checks](../../checks/strong-room/README.md) and [acceptance criteria](acceptance-criteria.md).
4. [Monitoring](../../monitoring/README.md) and [alerts](../../alerts/README.md).

The supplied concrete profile is a static NGINX application behind a host-managed
Cloudflare Tunnel. Applications with APIs, writes, databases, sessions, uploads,
or a different runtime must implement equivalent controls with their own threat
review. Access admission does not replace application authorization.

A deployment must map every requirement to evidence or an approved, time-bounded
exception: requirement ID, reason, risk, compensating controls, owner, approval,
and review/expiry date. Unknown evidence is never an implicit exception.
Security reviews baseline changes; application owners select and record the
adopted baseline revision and independently accept each deployment.
