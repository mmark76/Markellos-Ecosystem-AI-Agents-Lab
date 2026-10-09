# Project Operating Model

## Status

Canonical Markellos Ecosystem delivery model for software and infrastructure projects.

**Operating model:** Hybrid Agile + DevOps + GitOps principles

This document defines how work moves from product intent to a verified operating state. It complements `FRAMEWORK.md`; it does not replace product, architecture, security, testing, deployment, governance, or completion documents.

## Purpose

The framework combines adaptive planning with controlled engineering delivery:

- **Hybrid Agile** for product goals, roadmaps, backlogs, iterative delivery, feedback, and reprioritization.
- **DevOps** for an integrated build, test, security, release, deployment, verification, operations, and recovery flow.
- **GitOps principles** for version-controlled desired state, reviewed change intent, reproducibility, traceability, and drift awareness.
- **Risk-based governance** for approvals, security gates, rollback, evidence, and completion criteria proportional to impact.

The framework is not pure Scrum, does not require fixed sprints, and does not require Kubernetes or a specific GitOps product.

## Standards and security authority

[Ecosystem Engineering Standards](https://github.com/mmark76/Ecosystem-Engineering-Standards) owns cross-cutting normative engineering requirements. [Ecosystem Security — The Shield](https://github.com/mmark76/Ecosystem-Security-The-Shield) owns security requirements and controls. This operating model owns the method used to adopt, implement, verify, evidence and complete applicable requirements; it does not redefine either authority.

## Canonical Delivery Loop

```text
VISION
→ ROADMAP
→ BACKLOG
→ CURRENT ITERATION / CHANGE WINDOW
→ CODE / CONFIGURATION
→ GIT BRANCH / COMMIT / PR
→ AUTOMATED VALIDATION
→ SECURITY / RISK GATE
→ DEPLOY
→ VERIFY
→ OPERATE / OBSERVE
→ LEARN
→ NEXT ITERATION
```

No production change is complete merely because code was merged or deployment commands finished. Completion requires the applicable verification and evidence gates.

## Work Hierarchy

### Product Goal

Defines the durable outcome the project exists to achieve. Record it in the project brief or an approved project-specific product document.

### Product Roadmap

Shows the ordered direction of travel without pretending that distant implementation details are fixed. A roadmap should distinguish:

- `DONE` — verified completed work,
- `CURRENT` — the single active objective or controlled work package,
- `NEXT` — approved ordered work that follows,
- `LATER` — deferred candidate work,
- `UNKNOWN` — material facts not yet verified.

### Backlog

Contains candidate features, technical work, risks, debt, findings, improvements, and deferred ideas. Backlog presence is not approval to implement. Scope and change-control rules still apply.

### Iteration / Change Window

The smallest coherent, reviewable unit of delivery. It may be a feature iteration, remediation task, infrastructure change, deployment phase, or narrowly scoped experiment.

Each iteration must define, as applicable:

- goal,
- in-scope and out-of-scope boundaries,
- acceptance criteria,
- dependencies and assumptions,
- risks and blast radius,
- verification method,
- rollback or recovery condition,
- evidence required for completion.

### Increment

A working, verified result that advances the product goal. An increment may be software, configuration, infrastructure state, documentation, a deployment artifact, or an operational capability.

## Hybrid Agile Rules

1. Maintain a stable product goal while allowing implementation details and priorities to evolve through evidence and feedback.
2. Prefer small, independently reviewable increments over large batches.
3. Re-plan when evidence changes; do not preserve an obsolete plan merely because it was written earlier.
4. Keep only one clearly identified current objective when possible.
5. Do not silently promote backlog items into approved scope.
6. Use release scope, acceptance criteria, and change control where commitments or production risk require them.
7. Record meaningful decisions, blockers, unknowns, and lessons so future iterations do not depend on chat history or memory.

## DevOps Rules

Development, validation, security, deployment, and operations are one delivery system rather than isolated phases.

For applicable projects:

1. Changes originate from an approved objective, defect, risk treatment, or backlog item.
2. Work is made traceable through Git commits and, for material changes, pull requests.
3. Automated checks should run as early as practical: formatting, linting, tests, security checks, configuration validation, artifact verification, and other project-specific gates.
4. Production readiness is evaluated before exposure or traffic changes.
5. Deployment must be reproducible from an identified source revision and configuration.
6. Deployment verification must test the resulting runtime state, not only the deployment command exit status.
7. Rollback and recovery are first-class delivery capabilities for changes with meaningful operational impact.
8. Operational findings return to the backlog, risk register, issue tracking, or next iteration as appropriate.

## GitOps Principles

GitOps in this framework means applying the following principles where safe and practical:

### Version-controlled declared state

Code, deployment definitions, infrastructure configuration, policy, and operational instructions should be version-controlled when they can be represented safely in Git.

Material that applicable Shield requirements exclude from version control is handled through the project's approved protected configuration and evidence locations rather than committed merely to satisfy GitOps.

### Reviewed change intent

Material desired-state changes should be represented by a reviewable Git change before they are applied to production, unless an emergency procedure explicitly authorizes otherwise.

### Reproducibility

A reviewer should be able to identify the source revision, configuration, artifact, and procedure that produced a deployed state.

### Desired state versus actual state

Git is authoritative for **declared configuration and approved change intent** where the project has adopted that configuration into Git.

The live provider, server, runtime, database, or other system remains evidence of **actual state**. A difference between declared and actual state is drift and must be investigated rather than silently reconciled by assumption.

### Controlled reconciliation

Automatic reconciliation is optional, not mandatory. Projects may use manual, semi-automated, or automated reconciliation depending on risk, platform support, and owner approval.

Automation must not bypass required security, approval, maintenance-window, backup, or rollback controls.

## DevSecOps and Security Gates

Security is integrated into planning and delivery rather than deferred until release.

Projects identify the applicable Shield baseline and requirement IDs, map them to project-owned controls and verification, and record sanitized evidence and exceptions through `SECURITY_RULES.md`, project security records, and `checklists/SECURITY_GATE.md`. The exact security requirements, control definitions, exception conditions, and risk treatment remain authoritative in The Shield.

## Risk-based Tailoring

The framework is intentionally scalable. Not every repository needs the same process weight.

### Lightweight change

Suitable for low-impact, reversible, non-production or documentation-only work.

Minimum pattern:

```text
Scoped change → Git → review/checks → verify → complete
```

### Standard change

Suitable for ordinary application or infrastructure delivery.

Minimum pattern:

```text
Objective → PR → tests/security checks → deploy → runtime verification → evidence
```

### High-impact / production change

Suitable for authentication, networking, databases, public exposure, critical services, irreversible data changes, or broad infrastructure impact.

Minimum pattern:

```text
Approved scope
→ preflight and risk review
→ backup/recovery readiness where applicable
→ PR and independent verification where practical
→ security/production-readiness gate
→ controlled deployment
→ post-deployment verification
→ rollback on failed gate
→ evidence and completion decision
```

Project criticality may require stricter controls than these minimums.

## Git and Pull Request Discipline

- Preserve a traceable relationship between approved work and the resulting commits.
- Prefer branches and pull requests for material framework, application, infrastructure, security, and production-affecting changes.
- Keep changes narrowly scoped; avoid unrelated refactors inside operational changes.
- Do not treat repository renames as authorization to rename runtime resources, domains, services, databases, or provider objects.
- Preserve historical evidence and provenance even when current canonical names change.
- Use commit SHAs, immutable artifact identities, checksums, or equivalent evidence where reproducibility matters.

## CI, Testing, and Verification

Automation should progressively reduce the chance that an invalid change reaches production.

Projects use this pipeline to demonstrate applicable Engineering Standards requirements, including `ENG-TEST-001`, and applicable Shield requirements. The exact checks and evidence remain project- and risk-specific.

The applicable pipeline may include:

```text
format / lint
→ unit tests
→ integration tests
→ security checks
→ configuration validation
→ build
→ artifact verification
→ deployment readiness
→ deploy
→ smoke / health / regression verification
```

The exact pipeline is project-specific. Passing CI does not by itself prove successful production operation.

## Deployment and Rollback

Before a material production change, define:

- target environment,
- exact source revision and artifact,
- prerequisites and dependencies,
- expected state delta,
- health and acceptance checks,
- stop conditions,
- rollback procedure,
- resources created by the change,
- evidence to capture.

Rollback should revert only the resources or state introduced by the failed change unless a wider recovery action is separately authorized.

## Operations and Observability

Projects operationalize `ENG-OBS-001` with observability proportional to their criticality. Project-specific evidence can include health checks, logs, metrics, traces, uptime monitoring, alerting, audit events, capacity signals, backup verification, and restore testing. Security monitoring and alert requirements remain authoritative in The Shield.

Observability is part of the feedback loop: operational evidence can create risks, issues, backlog items, or roadmap changes.

## Evidence and Provenance

The existing framework evidence chain remains authoritative:

```text
Objective
→ Requirement
→ Decision
→ Implementation
→ Verification
→ Evidence
→ Approval
```

For infrastructure and deployment work, evidence should additionally identify actual runtime/provider state when that distinction matters.

Do not fill evidence gaps by assumption. Mark unverified material facts as `UNKNOWN` until proven.

## Roles and Separation of Duties

The roles defined in `FRAMEWORK.md` remain applicable.

For material changes:

- the Human Owner approves scope, priorities, risk acceptance, and release completion,
- the Planning role defines the work and acceptance conditions,
- the Builder role implements the approved change,
- the Verifier role independently checks the result when practical.

An AI agent must not approve its own material scope increase or silently waive a failed gate.

## Adoption Across the Markellos Ecosystem

This operating model is the canonical framework direction for Markellos Ecosystem software and infrastructure projects.

Adoption is **controlled and project-specific**:

- new projects should record the current integrated template and adopted DNA revision,
- existing projects do not receive bulk automatic changes,
- each existing project adopts applicable framework changes through its own reviewed scope and regression evidence,
- production or provider mutations always require the project-specific authorization required by that project,
- exceptions must be recorded rather than silently ignored.

Use `UPGRADE_GUIDE.md` when applying a newer framework release to an existing repository.

## Completion Rule

An iteration, release, or infrastructure change may be declared complete only when its approved mandatory scope, applicable Engineering Standards and Shield requirements, and applicable acceptance, architecture, security, quality, production-readiness, evidence, and operational verification gates pass.

Failed deployment is not completion. A successful rollback restores safety but returns the objective to an incomplete, blocked, or replanning state unless the approved objective itself was rollback.

## Continuous Improvement

After meaningful releases, incidents, failed deployments, rollbacks, or major discoveries:

1. capture the lesson,
2. update risks, decisions, backlog, documentation, or automation where justified,
3. adjust the roadmap if evidence changed priorities,
4. begin the next iteration from the new verified state.

The operating model therefore forms a continuous loop:

```text
PLAN → BUILD → VERIFY → DEPLOY → OPERATE → LEARN → ADAPT
```
