# Architecture Adoption and Verification

## Status and authority

This compatibility entry point operationalizes the authoritative requirements in [Ecosystem Engineering Standards](https://github.com/mmark76/Ecosystem-Engineering-Standards/blob/main/ENGINEERING-REQUIREMENTS.md). It is DNA methodology, not an independent normative engineering standard.

Engineering Standards defines **what** engineering conformity requires. The DNA defines **how** a project selects an architecture, records decisions, implements boundaries, verifies applicable requirements, manages exceptions, and supplies completion evidence.

## Requirements mapping

| Engineering Standards requirements | DNA operationalization |
|---|---|
| `ENG-ARCH-001` through `ENG-ARCH-004` | Record responsibilities, boundaries, dependency direction, architecture drivers, trade-offs, and the smallest justified design in `docs/architecture/`. |
| `ENG-MAINT-001`, `ENG-MAINT-002`, `ENG-DEBT-001` | Keep changes local and understandable; use the root-cause protocol; record material debt and temporary mitigations in project governance. |
| `ENG-API-001`, `ENG-API-002` | Document public contracts, consumers, compatibility expectations, migrations, deprecations, and removal conditions. |
| `ENG-TEST-001`, `ENG-DOC-001`, `ENG-DATA-001` | Define architecture checks, retain current documentation and ADRs, and link schema evolution to tests and recovery decisions. |
| `ENG-REL-001`, `ENG-OBS-001`, `ENG-PERF-001` | Define project-specific failure behavior, diagnostic evidence, performance criteria, and representative verification. |
| `ENG-CONF-001`, `ENG-DEP-001`, `ENG-DEP-002` | Document and validate runtime configuration; inventory material dependencies and providers; assign lifecycle ownership; and record justified adapter boundaries. |
| `ENG-SEC-001` | Identify and satisfy applicable requirements from The Shield through the project's security plan, threat model, gate, and evidence. |

## Architecture workflow

For each project or material architecture change:

1. Identify the approved requirements, users, data, dependencies, trust boundaries, operational constraints, and failure impact.
2. Define the system boundary and assign each responsibility, interface, and owned data set to a module or service.
3. Record permitted dependency direction and the mechanisms used to detect violations where practical.
4. Select the smallest architecture that satisfies current requirements and the next evidenced extension pressure.
5. Record significant choices, rejected alternatives, trade-offs, and review triggers as ADRs.
6. Add tests or static checks for material invariants and regression risks.
7. Map implementation and verification evidence to the applicable `ENG-*` identifiers.
8. Run `checklists/ARCHITECTURE_GATE.md` and record any exception before completion.

## Non-normative organization examples

Folder names depend on the technology and project. A project may organize code around applications, packages, features, domain modules, shared code, and infrastructure adapters when those boundaries reflect real responsibilities.

```text
project/
├── apps/
├── packages/
├── src/
│   ├── app/
│   ├── features/
│   ├── shared/
│   └── infrastructure/
├── tests/
├── docs/
└── scripts/
```

A common logical dependency model is:

```text
Presentation / UI
        ↓
Application / Use Cases
        ↓
Domain / Business Rules

Infrastructure adapters implement interfaces owned by inner layers.
```

These examples are not prescribed structures. Dependency ownership and clear interfaces matter more than folder names.

## Review prompts

During design and review, examine whether:

- a unit changes for unrelated reasons or contains multiple responsibilities;
- a small change requires excessive context or touches unrelated modules;
- duplication, branching, hidden side effects, or deep imports obstruct testing;
- shared code is actually used by independent consumers rather than acting as a dumping ground;
- an external provider is spread through domain code instead of isolated at an owned boundary;
- a new feature has an owner, interface, data boundary, tests, documentation, and a removal or replacement strategy where relevant;
- a correction addresses its responsible cause and includes regression coverage where practical;
- a full rebuild or new infrastructure layer is being proposed without evidence that smaller changes are insufficient.

## Verification and completion

Architecture evidence normally includes the current system architecture, relevant ADRs, dependency or boundary checks, affected tests, traceability records, and approved exceptions. The exact evidence is project- and risk-specific.

`checklists/ARCHITECTURE_GATE.md` remains the DNA verification gate. Passing it records how the project demonstrated applicable Engineering Standards requirements; it does not create a second source for those requirements.
