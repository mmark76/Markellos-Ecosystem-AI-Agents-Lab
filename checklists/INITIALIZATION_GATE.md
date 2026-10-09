# Project Initialization Gate

Use this gate immediately after creating a repository from the template and
before the development-readiness review. It verifies that template material has
been converted into approved, project-specific authority.

## Pass Rule

Every applicable item must be checked. Mark an item not applicable only with a
written reason and owner. Any unresolved mandatory item results in `REWORK` or
`BLOCKED`; development readiness may not pass.

## Identity and Ownership

- [ ] `docs/product/PROJECT_BRIEF.md` defines the project name, purpose, users, value, and current project version.
- [ ] Product, technical, security, operations, data/privacy, and release-scope owners are named, with any non-applicable role justified.
- [ ] Project criticality, safety impact, data sensitivity, outage tolerance, and data-loss tolerance are recorded; any applicable framework profile is selected, or its non-applicability is justified.
- [ ] `FOUNDATION_VERSIONS` records the adopted foundation revisions, or an approved project update record identifies different revisions.

## Scope, Requirements, and Experience

- [ ] `docs/product/RELEASE_SCOPE.md` defines a finite release, its owner, boundaries, mandatory items, out-of-scope items, and approval state.
- [ ] Project objectives, requirements, acceptance criteria, and traceability records use real approved IDs.
- [ ] Applicable `ENG-*` requirements, non-applicable requirements with rationale, and permitted exceptions are recorded in `engineering/requirements/ENG_ADOPTION_MATRIX.md`.
- [ ] Applicable Shield requirements, selected baseline/revision, and project-specific security evidence locations are recorded without copying private Shield material.
- [ ] The approved app theme is recorded for user-facing projects, or non-applicability is documented.
- [ ] Any dashboard, landing page, project-status page, or main web interface is explicitly governed by `PROJECT_DASHBOARD_GUIDE.md`, including Header → Main Content → Footer, project identity, simple navigation, ecosystem return path where applicable, footer copyright, and visible version/build identification.

## Template Safety

- [ ] Every `EXAMPLE-*` row is removed or replaced with approved project data.
- [ ] Blank instructional metadata is completed or explicitly marked not applicable with an owner and reason.
- [ ] No example identifier is referenced as approval, implementation authority, test evidence, risk acceptance, or an exception.

## Project Commands

- [ ] The actual formatting command is defined, or non-applicability is justified.
- [ ] The actual linting command is defined, or non-applicability is justified.
- [ ] The actual type-check command is defined, or non-applicability is justified.
- [ ] The actual unit, integration, end-to-end, and accessibility test commands are defined, or each non-applicable level is justified.
- [ ] The actual security, dependency, and secret-scan commands are defined, or each non-applicable scan is justified.
- [ ] The actual build command is defined, or non-applicability is justified.
- [ ] Command definitions in `AGENTS.md` and `docs/testing/TEST_STRATEGY.md` agree and contain no `<define>` placeholders.

## Environment and Secrets

- [ ] Supported local, test, staging, and production environments are identified where applicable.
- [ ] Environment-specific configuration is separated from source code and its validation/default behavior is documented.
- [ ] The secrets policy defines approved storage, access, rotation, revocation, local-development handling, and the prohibition on committing secrets or populated environment files.
- [ ] Required environment variables are documented without real secret values, and ignore rules are reviewed for project-specific secret files.

## Project Documentation

- [ ] Project-specific content is initialized in the product brief, release scope, objectives, acceptance criteria, and traceability matrix.
- [ ] System architecture, architecture decisions, data plan, security plan, threat model, test strategy, operations/recovery plan, risk register, and exceptions register are initialized or explicitly marked not applicable with reasons.
- [ ] Required UI/UX, accessibility, localization, and dashboard decisions are recorded for user-facing work.
- [ ] `docs/infrastructure/INFRASTRUCTURE_PROFILE.md` selects `NOT_APPLICABLE`, `LOCAL_ONLY`, `SHARED_INFRASTRUCTURE`, or `DEPLOYED_SERVICE`; selected deployment and recovery decisions are recorded when applicable.
- [ ] Initialization evidence identifies the reviewer, date, adopted template/foundation revisions, unresolved items, and final decision.

## Decision

- Reviewer:
- Date:
- Adopted template/foundation revisions:
- Non-applicable items and reasons:
- Unresolved items:
- Decision: `PASS` / `REWORK` / `BLOCKED`
