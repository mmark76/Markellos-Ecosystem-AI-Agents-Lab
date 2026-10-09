# DNA Adoption Workflow

## Purpose

This included, project-safe DNA adoption workflow explains how a project is conceived, scoped, experience-designed, architected, secured, developed, tested, deployed, operated, completed, evolved, and retired. The canonical source remains Ecosystem Framework — The DNA.

## Authority Boundary

[Ecosystem Engineering Standards](https://github.com/mmark76/Ecosystem-Engineering-Standards) defines **what** cross-cutting engineering conformity requires through stable `ENG-*` requirement identifiers. Ecosystem Security — The Shield defines security requirements and controls. [Ecosystem Infrastructure](https://github.com/mmark76/ecosystem-infrastructure) owns shared infrastructure mechanisms.

The DNA defines **how** projects determine applicability, implement requirements, verify behavior, record evidence and exceptions, pass gates, and reach completion. Project-specific architecture and implementation remain with the project. Strong Room remains a concrete Shield security pattern rather than a universal Engineering Standard.

## Lifecycle

```text
Idea
→ Project Initialization
→ Feasibility
→ Product Definition
→ Requirements
→ Experience Design and Accessibility
→ Scope Freeze
→ Risk and Criticality
→ Architecture
→ Security and Privacy
→ Development Readiness
→ Implementation
→ Verification
→ Production Readiness
→ Release Completion
→ Operation
→ Controlled Evolution
→ Retirement
```

## Operating Model

Markellos Ecosystem software and infrastructure projects follow the canonical
`PROJECT_OPERATING_MODEL.md` using **Hybrid Agile + DevOps + GitOps principles**.

The operating model provides the delivery loop that connects product intent,
roadmaps, backlogs, iterations, Git/PR review, automated validation, security,
deployment, runtime verification, operations, learning, and the next iteration.
It uses risk-based tailoring so low-impact work stays lightweight while
production, security, database, network, and other high-impact changes retain
explicit gates, rollback, evidence, and owner approval where required.

Existing projects do not receive template or foundation changes automatically. Adoption is controlled and project-specific through the integrated-template versioning and upgrade process.

Engineering Standards and Shield requirements are adopted through this same
controlled, project-specific process; copying their normative text into project
methodology does not create a new source of authority.

## Project Initialization

Immediately after creating a repository from this template, complete
`checklists/INITIALIZATION_GATE.md`. It converts instructional template content
into project-specific authority and must pass before
`checklists/DEVELOPMENT_READINESS.md` can pass.

Unresolved identity, ownership, criticality/profile, scope, theme, example-row,
project-command, environment/secrets, or required-documentation items block
development readiness.

## Core Modules

1. Product and Scope
2. Requirements and Traceability
3. Experience Design, Design System, and Accessibility
4. Engineering Standards Adoption and Architecture Evidence
5. Shield Requirements Adoption and Security Evidence
6. Data and Privacy
7. Frontend Engineering
8. Backend and API Engineering
9. Testing and Quality
10. Infrastructure, Deployment, and Operations
11. Governance and Change Control
12. Completion and Stop Protocol
13. Future Evolution and Retirement

## Experience Design Rule

Every user-facing project must:

- identify its users, key journeys, and critical tasks,
- select one approved Markellos app theme,
- use the shared design tokens and component contracts,
- define responsive and platform-specific behavior,
- define loading, empty, error, offline, and success states,
- define measurable accessibility criteria,
- record evidence for material UI changes.

Visual implementation is part of the controlled product design, not an independent styling phase.

## Release Philosophy

Every release has a finite approved scope.

Completion means:

> 100% of the approved mandatory release scope has been implemented and verified.

Completion does not mean every possible feature exists, the system can never be improved, or no future maintenance will be needed.

## Integrated Template Versioning

`TEMPLATE_VERSION` is the repository-level source of truth and uses semantic
versioning. `FOUNDATION_VERSIONS` identifies the assessed upstream revisions.
Record notable changes in `CHANGELOG.md` and use `UPGRADE_GUIDE.md` when
adopting a newer integrated template into an existing project. This version does
not replace the project/application version or the visible build identity
required by `PROJECT_DASHBOARD_GUIDE.md`.

## Evidence Chain

```text
Objective
→ Requirement
→ Experience and Design Decision
→ Architecture Decision
→ Implementation
→ Verification
→ Evidence
→ Approval
```

Code alone is not proof of completion.

## Roles

### Human Owner
Approves scope, priorities, risk acceptance, major product and design decisions, and release completion.

### Planning Agent
Clarifies objectives, requirements, users, journeys, edge cases, accessibility needs, and acceptance criteria.

### Builder Agent
Implements approved work using applicable Engineering Standards requirements, Shield requirements and controls, the approved design system, and DNA verification practices.

### Verifier Agent
Checks applicable requirement traceability, project architecture, Shield security evidence, UI/UX consistency, accessibility, tests, evidence, and completion.

Independent verification is preferred when practical.
