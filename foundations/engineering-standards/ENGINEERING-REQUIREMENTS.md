# Engineering Requirements

## Status and applicability

This document is the initial consolidated normative engineering baseline for the Markellos Ecosystem. It defines required outcomes, not implementation procedures.

Projects determine applicability and record adoption, verification, evidence, and approved exceptions through [The DNA](https://github.com/mmark76/ecosystem-framework). Domain-specific architecture remains with its owning system. Security requirements and security exceptions remain governed by [The Shield](https://github.com/mmark76/Ecosystem-Security-The-Shield).

## Architecture and boundaries

### ENG-ARCH-001 — Explicit responsibility

Every material component, module, service, or system **MUST** have a clear, cohesive responsibility and an identifiable owner. A responsibility **MUST NOT** be duplicated across components without an explicit justification.

### ENG-ARCH-002 — Explicit boundaries and interfaces

Systems **MUST** define their material boundaries, owned data, public interfaces, and permitted dependencies. Components **MUST NOT** depend on another component's private implementation details.

### ENG-ARCH-003 — Controlled dependency direction

Dependency direction **MUST** be explicit and **MUST NOT** contain unresolved circular dependencies. Business and domain rules **MUST NOT** depend directly on presentation frameworks, storage implementations, or external-provider SDKs where an owned interface can preserve the boundary.

### ENG-ARCH-004 — Proportionate simplicity

Architecture **MUST** be no more complex than the verified current need requires. New abstractions, shared layers, services, or infrastructure **SHOULD** be introduced only when concrete requirements or demonstrated change pressure justify them.

## Maintainability and change health

### ENG-MAINT-001 — Maintainable implementation

Implementation **MUST** remain understandable, searchable, and testable by a competent maintainer without relying on undocumented context. Units **SHOULD** be divided when multiple responsibilities, excessive branching, duplication, or hidden side effects materially obstruct safe change.

### ENG-MAINT-002 — Root-cause corrections

Corrections **SHOULD** address the responsible cause rather than accumulate unrelated patches. A temporary mitigation **MUST** be identified as temporary, assigned an owner, and given a review or removal condition.

### ENG-DEBT-001 — Technical-debt visibility

Material technical debt **MUST** remain visible with its impact, owner, and intended treatment or review condition. Known debt **MUST NOT** be represented as completed conformity.

## Interfaces and compatibility

### ENG-API-001 — Contract definition

Material interfaces and APIs **MUST** define inputs, outputs, error behavior, ownership, and compatibility expectations. Externally consumed interfaces **SHOULD** be versioned when incompatible evolution is reasonably foreseeable.

### ENG-API-002 — Compatibility and deprecation

Breaking interface changes **MUST** be identified explicitly and assessed against known consumers. Deprecation **MUST** define the affected contract, migration path, responsible owner, and removal condition; an interface **MUST NOT** be removed while supported consumers still depend on it unless an approved exception records the impact.

## Verification and documentation

### ENG-TEST-001 — Proportionate automated verification

Systems **MUST** provide repeatable verification proportionate to their criticality and change risk. Critical logic and material integration boundaries **MUST NOT** rely solely on manual visual inspection for acceptance. Significant defect corrections **SHOULD** include regression coverage where practical.

### ENG-DOC-001 — Current engineering documentation

Material architecture, interfaces, runtime dependencies, operational assumptions, and verification methods **MUST** be documented and kept consistent with the implemented system. Significant decisions and accepted trade-offs **SHOULD** be recorded in a durable decision record.

### ENG-DATA-001 — Controlled persistent-data evolution

Persistent data or schema changes **MUST** use a versioned, reviewable evolution mechanism. The change **MUST** define integrity expectations and a recovery, compatibility, or explicitly irreversible migration decision proportionate to its impact.

## Reliability, observability, and performance

### ENG-REL-001 — Defined failure and recovery behavior

Systems **MUST** define material failure modes and expected recovery behavior proportionate to their operational impact. Where partial failure is possible, timeout, retry, idempotency, degradation, and rollback behavior **SHOULD** be explicit rather than accidental.

### ENG-OBS-001 — Proportionate observability

Operated systems **MUST** expose enough health and diagnostic evidence to distinguish normal operation from material failure. Logs, metrics, traces, alerts, or equivalent signals **MAY** be selected according to system criticality; ownership, interpretation, retention, and security requirements remain with their authoritative domains.

### ENG-PERF-001 — Measurable performance and capacity

When performance or capacity can materially affect users, safety, cost, or reliability, projects **MUST** define measurable acceptance criteria and representative verification conditions. Resource budgets and scaling assumptions **SHOULD** be explicit for constrained or shared environments.

## Dependencies and external services

### ENG-CONF-001 — Explicit runtime configuration

Runtime configuration and environment-specific dependencies **MUST** be explicit, documented, and validated at an appropriate boundary. Domain behavior **SHOULD NOT** depend on hidden environment state. Handling requirements for secret or sensitive configuration remain governed by The Shield.

### ENG-DEP-001 — Dependency lifecycle

Runtime and build dependencies **MUST** be explicit, justified, and assigned an update or replacement owner. Projects **SHOULD** prefer maintained dependencies and **MUST** define a response when a dependency becomes unsupported, incompatible, or operationally unavailable. Security assessment of dependencies remains governed by The Shield.

### ENG-DEP-002 — External-provider isolation

External providers **SHOULD** be isolated behind owned interfaces when replacement, testing, availability, cost, or compatibility risk is material. Provider-specific behavior **MUST NOT** leak into unrelated domain rules without an explicit architecture decision.

## Security authority

### ENG-SEC-001 — Applicable Shield requirements

Systems **MUST** satisfy the security requirements applicable to their scope and risk as defined by The Shield. This requirement does not redefine Shield controls, and no Engineering Standards interpretation may weaken or supersede them.
