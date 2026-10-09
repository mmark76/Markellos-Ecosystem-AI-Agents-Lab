# General Software Project Adoption Guide

**Document revision:** 2.0

**Status:** DNA methodology

**Owner:** Integrated Project Template adoption layer; DNA remains the lifecycle authority.

## Purpose and authority

This guide preserves the practical project-organization value of the former approved software guide while implementing the ecosystem's WHAT/HOW separation.

[Ecosystem Engineering Standards](https://github.com/mmark76/Ecosystem-Engineering-Standards/blob/main/ENGINEERING-REQUIREMENTS.md) is authoritative for cross-cutting normative engineering requirements. This DNA guide explains a reusable way to adopt and demonstrate them. It does not restate or supersede those requirements.

Security requirements are owned by [Ecosystem Security — The Shield](https://github.com/mmark76/Ecosystem-Security-The-Shield). Project-specific architecture and implementation remain with the adopting project.

## Adoption sequence

1. Identify the applicable `ENG-*` requirements and any domain-owned requirements.
2. Record system purpose, users, architecture drivers, constraints, data, dependencies, and operational impact.
3. Assign responsibilities and owned data to explicit modules or services.
4. Document public interfaces and permitted dependency direction.
5. Select the smallest structure that supports the approved scope.
6. Define tests and other verification for material boundaries and behavior.
7. Record significant decisions and trade-offs as ADRs.
8. Link requirements to implementation, verification, evidence, and exceptions through the project traceability model.
9. Run the applicable DNA gates and stop when the approved completion conditions pass.

## Practical organization guidance

Projects commonly benefit from organization by feature or domain rather than only by technical file type. A feature may contain its own presentation, application, domain, validation, infrastructure, and test concerns when that arrangement keeps ownership clear.

Shared code is useful after independent reuse is demonstrated. Code used by only one feature normally stays with that feature until a stable shared responsibility emerges.

Entry-point files are easier to maintain when they coordinate startup and composition rather than contain unrelated business behavior. Likewise, presentation, application logic, domain rules, data access, provider integration, validation, and state management are easier to evolve when their boundaries remain explicit.

Line counts are warning signals rather than universal limits. Consider splitting a unit when it has several responsibilities, changes for unrelated reasons, contains material duplication, requires excessive context for a small change, or cannot be tested independently.

## Change and correction guidance

Prefer small, focused changes tied to an approved requirement, defect, risk, or maintenance objective. Keep structural refactoring separate from unrelated feature work and protect behavior with tests.

For a defect, reproduce the behavior, identify the responsible cause and module, add regression coverage where practical, implement the narrow structural correction, and inspect affected behavior. Record temporary mitigations and technical debt through project governance instead of presenting them as final conformity.

Use a dedicated branch and pull request for material work where the project workflow supports them. Inspect the final diff and preserve a traceable relationship between the approved work, implementation, verification, and evidence.

## Testing and documentation guidance

Select unit, component, integration, API, end-to-end, accessibility, performance, recovery, and other checks according to the project's risks and acceptance criteria. Record the commands and evidence in `docs/testing/TEST_STRATEGY.md` and the traceability matrix.

Keep architecture, requirements, decisions, testing, deployment, operations, and recovery documentation proportional to the project. Documentation is project-owned and reflects the actual implementation rather than copying generic examples unchanged.

## Related DNA mechanisms

- `FRAMEWORK.md` — lifecycle and framework map.
- `PROJECT_OPERATING_MODEL.md` — delivery methodology.
- `ARCHITECTURE_RULES.md` — Engineering Standards mapping and architecture workflow.
- `docs/architecture/` — project architecture and ADR records.
- `docs/testing/TEST_STRATEGY.md` — project verification plan.
- `docs/requirements/TRACEABILITY_MATRIX.md` — requirement-to-evidence mapping.
- `checklists/` — readiness, architecture, quality, security, production, and completion gates.
- `CHANGE_CONTROL.md` and `docs/governance/EXCEPTIONS.md` — scope and exception handling.

The former version 1.0 normative text remains available in Git history for provenance. From version 2.0 onward, this file is methodology subordinate to Engineering Standards and The Shield.
