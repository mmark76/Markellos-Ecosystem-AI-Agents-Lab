# Shield security capability architecture

## Purpose

Ecosystem Security — The Shield is the horizontal security authority for the
Ecosystem. It defines what security is required, who is accountable, how a
requirement is assessed, and what evidence can support a bounded security claim.
It is an extensible governance and assurance system, not merely a document
collection and not an assertion that every planned capability already operates.

The canonical capability landscape is
[machine-readable](../model/security-capabilities.json) and rendered into the
[human-readable catalogue](security-capability-model.md). The repository is at
an early foundation stage. Strong Room v1 is the only implemented reusable
capability; other statuses describe exactly the narrower foundation or partial
scope held here.

## Sources of truth

| Concern | Canonical source |
| --- | --- |
| Capability identity, grouping, maturity, responsibility, expected controls/evidence, dependencies, roadmap, and future automation | [`model/security-capabilities.json`](../model/security-capabilities.json) |
| Capability registry contract | [`schemas/security-capability.schema.json`](../schemas/security-capability.schema.json) |
| Control semantics | [`schemas/security-control.schema.json`](../schemas/security-control.schema.json) |
| Evidence semantics | [`schemas/evidence-item.schema.json`](../schemas/evidence-item.schema.json) |
| Exception semantics | [`schemas/security-exception.schema.json`](../schemas/security-exception.schema.json) |
| Implemented private-application baseline | [Strong Room v1](../standards/private-app-security-baseline/README.md) |
| Populated application configuration, application threat models, runtime state, and adoption evidence | The adopting application/service repository or authorized operational system |

The generated capability catalogue must not be edited directly. Change the
registry, run `node scripts/render-capability-catalog.cjs`, and run the tests.

## Architectural layers

```text
Ecosystem inventory and operational systems
  -> asset/service references and observed state

Shield policy and standards
  -> canonical controls and applicability
  -> reusable baselines such as Strong Room

Application/service adoption
  -> populated configuration and implementation
  -> application-owned threats, risks, exceptions, and evidence

Shield assurance semantics
  -> assessment with provenance
  -> explicit PASS / FAIL / BLOCKED / NOT TESTED /
     TECHNICALLY UNAVAILABLE
  -> bounded governance and reporting
```

Presentation consumes the model; it does not define maturity or control logic.
Future dashboards should render the registry or an evolved version of it instead
of hard-coding independent cards. Future collectors should attach observations
and evidence to referenced assets and controls rather than overwrite declared
configuration or canonical inventories.

## Ownership boundary

The Shield owns security principles, policies, standards, canonical controls,
assessment and evidence semantics, exception governance, and reusable security
baselines. Other systems retain their own authoritative facts and operations:

- Ecosystem Framework / The DNA supplies wider governance and conventions.
- Ecosystem Control — The Brain owns ecosystem inventory, coordination, and
  presentation. It may display Shield state but is not the security authority or
  the only security-alert path.
- Infrastructure and Foundation Systems own their implementation and runtime
  state. They provide scoped observations or evidence where authorized.
- Core, Intelligence, applications, and services own their populated
  configuration, application authorization, threat models, deployments, risks,
  and operational evidence.
- Authorized operators/providers own credentials, live provider state, identity
  enrollment, and approved production operations.

References and integrations are preferred over copying another system's
inventory. Real secrets, identity selectors, raw provider data, and sensitive
operational evidence do not belong in the Shield repository.

## Maturity is not assurance

Capability maturity and control assessment answer different questions:

- `PLANNED`, `FOUNDATION`, `PARTIAL`, `IMPLEMENTED`, and `VERIFIED` describe
  how far a Shield capability has progressed for its stated scope.
- `PASS`, `FAIL`, `BLOCKED`, `NOT TESTED`, and `TECHNICALLY UNAVAILABLE`
  describe the result of a particular control assessment.

`IMPLEMENTED` does not mean adopted everywhere. `VERIFIED` requires current,
scoped, attributable evidence. Documentation, intended configuration, a passing
source test, or missing failure evidence cannot silently produce `VERIFIED` or
`PASS`.

Availability is separate again: `ROADMAP` cards are informational;
`GOVERNANCE` means a model or governing artifact exists; `AVAILABLE` means a
bounded reusable Shield capability can be adopted. A planned card must never
look like a working control.

## Controls, evidence, and assurance

A canonical control records its objective, applicability, requirement level,
owner, guidance, validation method, evidence requirements, current assessment,
review dates, and links to standards, risks, threats, assets, repositories, and
services. New control catalogues should use stable IDs and extend the schema
deliberately rather than embedding rules in a dashboard.

Evidence is first-class and preserves:

- source and collection method;
- generated timestamp, environment, repository, commit, and artifact identity;
- the control tested and bounded result;
- confidence, provenance, reviewer, expiry, and staleness;
- whether the item is a declaration, an observation, or verified evidence.

The distinction is mandatory:

```text
declared configuration
  != observed configuration
  != verified evidence
```

An expected setting in a document is a declaration. Reading effective runtime
state is an observation. Verification combines an appropriate method,
provenance, scope, expected result, current observation, and review. Evidence can
expire or become stale after a relevant change.

## Risks, threats, and exceptions

A threat explains how something could go wrong. A risk evaluates the exposure
and consequence. They remain linked but are not interchangeable.

An exception is an explicit deviation from a control. It requires an affected
control, rationale, requester, named human approver, linked risk, compensating
controls, scope, start date, review date, expiry date, and status. There are no
permanent invisible bypasses. Expiry does not imply renewal, and absent evidence
does not imply an exception.

External compliance frameworks will map to Shield controls. They do not replace
the Shield control model as the canonical expression of ecosystem security.

## Strong Room integration

Strong Room is the first concrete capability beneath the Shield. The Shield owns
the reusable baseline in [`templates/strong-room/`](../templates/strong-room/),
its standard, generic checks, and evidence requirements. It covers a bounded
private HTTP application profile: Access and MFA, protected Tunnel ingress and
JWT validation, private origin isolation, NGINX, Docker/Compose hardening, health,
logout, immutable releases, deployment verification, and security evidence.

An adopting application copies or renders only the relevant templates and keeps
all populated values, live configuration, implementation, threat model,
exceptions, deployment decision, and evidence in its own repository or approved
operational system. Application-specific evidence is linked where appropriate;
it is not duplicated into the Shield.

Strong Room's `IMPLEMENTED` status means the reusable v1 baseline and its tests
exist. It does not state that every ecosystem service has adopted it, that every
deployment passes, or that the whole Ecosystem is verified.

## Production authorization

> **technical validation != authorization**

A named human approval gate is required immediately before every
production-impacting change. Tests, CI checks, scanner output, automation,
agents, and AI-generated recommendations may inform that decision but must never
be treated as authorization. A successful validation does not deploy, expose,
remediate, rotate, revoke, or otherwise change production.

Future automated security gates must fail closed, preserve the human gate, and
record the evidence input separately from the approval decision. Production
rollback and emergency actions follow the same explicit authority model, adapted
to approved incident procedures.

## Progressive adoption by applications and services

1. Identify the canonical application/service record and owner; link rather than
   copy the wider inventory.
2. Classify assets and data, identify threats and risks, and determine which
   Shield controls and baseline version apply.
3. Record explicit gaps or time-bounded exceptions. Unknown state remains
   `NOT TESTED` or `BLOCKED`, not `PASS`.
4. Implement controls in the application or operating domain. Keep populated
   configuration and secrets outside the Shield.
5. Validate locally and in the authorized target environment using methods
   appropriate to the control. Preserve provenance and sensitive-data limits.
6. Obtain the required human production approval immediately before production
   impact.
7. Store application-specific evidence with the application or approved evidence
   system, and expose only sanitized references/metadata to future Shield views.
8. Reassess after relevant changes and when evidence, risks, or exceptions age.

Adoption is gradual. No application needs to pretend an unavailable phase exists;
it must make the gap and its risk visible.

## Future automation boundary

The registry and schemas prepare for read-only posture collection, scanner
ingestion, evidence capture, stale-evidence and expiring-exception alerts,
control drift, security reporting, and deployment verification. They do not
implement a vault, identity provider, SIEM, scanner, deployment platform, or
automatic remediation service.

Automation must preserve source provenance, least-privilege read access,
collection failures, evidence freshness, and the difference between observation,
verification, and authorization. It must never ingest or emit credentials in
fixtures, logs, screenshots, documentation, or repository evidence.
