# Integrated Project Template

A consumable starter repository for new Markellos Ecosystem projects. It gives a project a governed starting point for lifecycle delivery, engineering quality, security-by-design, and infrastructure/runtime readiness.

This is not a fifth canonical foundation. The foundations define; this template packages safe adoption assets; each created project implements, verifies, and evidences its own result.

## Start here

1. Read [Foundation Sources](FOUNDATION_SOURCES.md) and [Foundation Versions](FOUNDATION_VERSIONS).
2. Set the project identity in [Project Brief](docs/product/PROJECT_BRIEF.md).
3. Complete the [Initialization Gate](checklists/INITIALIZATION_GATE.md).
4. Record requirements, security applicability, and infrastructure profile before development starts.
5. Use the applicable gates, retain evidence, and complete only approved release scope.

## Foundations and authority

| Foundation | Authority | What this template includes |
|---|---|---|
| [Ecosystem Framework — The DNA](https://github.com/mmark76/ecosystem-framework) | **HOW** projects plan, implement, verify, evidence, and complete work. | Lifecycle documents, gates, traceability, evidence, and completion workflow. |
| [Ecosystem Engineering Standards](https://github.com/mmark76/Ecosystem-Engineering-Standards) | **WHAT** lifecycle-independent engineering requirements apply. | `ENG-*` adoption records and a pinned sanitized catalogue snapshot in [`foundations/engineering-standards/`](foundations/engineering-standards/). |
| Ecosystem Security — The Shield | **WHAT** security requirements, controls, and trust boundaries apply. | Security adoption records plus a reviewed sanitized Strong Room snapshot in [`foundations/shield/`](foundations/shield/). |
| [Ecosystem Infrastructure](https://github.com/mmark76/ecosystem-infrastructure) | Reusable hosting, runtime, networking, deployment, and recovery mechanisms. | Infrastructure profile/readiness records and sanitized boundary guidance in [`foundations/infrastructure/`](foundations/infrastructure/). |

The pinned local snapshots are project-safe adoption aids, not competing authorities. The exact reviewed revisions are recorded in [FOUNDATION_VERSIONS](FOUNDATION_VERSIONS).

## What a new project receives

### Delivery and governance

- DNA lifecycle and operating model: [FRAMEWORK.md](FRAMEWORK.md) and [PROJECT_OPERATING_MODEL.md](PROJECT_OPERATING_MODEL.md)
- Scope, change, and completion controls: [CHANGE_CONTROL.md](CHANGE_CONTROL.md), [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md), and [COMPLETION_AND_STOP_PROTOCOL.md](COMPLETION_AND_STOP_PROTOCOL.md)
- Project gates: [`checklists/`](checklists/)
- Evidence structure: [`evidence/README.md`](evidence/README.md)
- Upgrade path: [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md)

### Product, requirements, architecture, and testing

Use these project-owned templates; replace all `EXAMPLE-*` content before approval.

| Need | Starting point |
|---|---|
| Project identity, problem, users, owners, constraints | [Project Brief](docs/product/PROJECT_BRIEF.md) |
| Finite approved release scope | [Release Scope](docs/product/RELEASE_SCOPE.md) |
| Objectives and measurable acceptance criteria | [Objectives](docs/requirements/OBJECTIVES.md) and [Acceptance Criteria](docs/requirements/ACCEPTANCE_CRITERIA.md) |
| Implementation, test, and evidence mapping | [Traceability Matrix](docs/requirements/TRACEABILITY_MATRIX.md) |
| System boundaries and architectural decisions | [`docs/architecture/`](docs/architecture/) |
| Data, privacy, testing, and operations | [`docs/data/`](docs/data/), [`docs/testing/`](docs/testing/), and [`docs/operations/`](docs/operations/) |
| Risks and permitted deviations | [`docs/governance/`](docs/governance/) |

### Engineering Standards adoption

The canonical catalogue remains upstream. Each project records its local decision and evidence in [ENG Adoption Matrix](engineering/requirements/ENG_ADOPTION_MATRIX.md):

- applicable `ENG-*` requirements;
- non-applicable requirements with a project-specific rationale and owner;
- permitted exceptions, approvals, and compensating controls;
- implementation, verification, and evidence references.

Use [Engineering Gate](checklists/ENGINEERING_GATE.md) before asserting engineering readiness or release completion. The pinned reference snapshot is available in [`foundations/engineering-standards/`](foundations/engineering-standards/).

### Shield security adoption

Every project records its own selected Shield revision/baseline, risk profile, threat model, controls, exceptions, and sanitized evidence:

- [Security Plan](docs/security/SECURITY_PLAN.md)
- [Threat Model](docs/security/THREAT_MODEL.md)
- [Security Gate](checklists/SECURITY_GATE.md)
- [Shield adoption boundary](security/baseline/README.md)

For suitable private HTTP workloads, the sanitized [Strong Room](foundations/shield/standards/private-app-security-baseline/README.md) assets include parameterized Docker Compose, NGINX, and tunnel templates; runtime-artifact, origin-binding, and container-hardening verifiers; schemas; and capability-model documentation. Strong Room is optional, must be selected explicitly, and never proves a deployment secure by itself.

### Infrastructure and deployment readiness

Select exactly one project infrastructure profile in [Infrastructure Profile](docs/infrastructure/INFRASTRUCTURE_PROFILE.md):

- `NOT_APPLICABLE` — no runtime/deployment infrastructure is needed.
- `LOCAL_ONLY` — approved developer or local use only.
- `SHARED_INFRASTRUCTURE` — the project integrates an owner-managed ecosystem mechanism.
- `DEPLOYED_SERVICE` — the project owns or operates a deployment integration.

Use [Infrastructure Readiness](checklists/INFRASTRUCTURE_READINESS.md) to record ownership, environment separation, trust boundaries, rollback/recovery, security dependencies, and verification evidence. No folder or template here authorizes a provider, DNS, firewall, server, or production change.

### UI/UX reference shell

The repository also contains a dependency-free reference dashboard shell and design tokens for projects that choose to adopt them:

- [Dashboard adoption guide](PROJECT_DASHBOARD_GUIDE.md)
- [UI/UX rules](UI_UX_RULES.md)
- [`design-system/`](design-system/)
- [Reference-site guidance](TEMPLATE_SITE.md)

It is a starter/reference asset, not a deployed application or mandatory project interface.

## Initialize a new project

1. Create a new repository from this template; retain the source history only if that is an approved project decision.
2. Record project identity, purpose, owners, and constraints in the Project Brief.
3. Define a finite approved scope, objectives, acceptance criteria, and project traceability.
4. Complete the Initialization Gate and remove or replace every instructional/example row.
5. Record Engineering Standards applicability in the ENG Adoption Matrix.
6. Identify applicable Shield requirements, selected baseline, threats, and evidence locations without adding credentials or private operational content.
7. Select an infrastructure profile, including `NOT_APPLICABLE` where justified.
8. Define architecture, testing, data/privacy, operations, recovery, and—in deployed projects—deployment/rollback decisions.
9. Pass Development Readiness before implementation.
10. Retain evidence throughout delivery, then pass the applicable Engineering, Security, Infrastructure, Quality, and Final Completion gates.

## Validation

Run the repository checks before changing or releasing the template:

```text
node scripts/validate-foundations.cjs
node --test tests/foundations.test.cjs foundations/shield/tests/*.test.cjs tests/dashboard-shell.test.cjs
node scripts/build-site.cjs <reviewed-commit> <new-output-directory>
```

The foundation validator checks that required vendored assets and revision pins exist and scans the snapshot for prohibited sensitive file names, common credential shapes, and public IPv4 literals. It is a bounded safety check, not a security certification.

## What is intentionally not included

- production hostname, Cloudflare Pages project, DNS, `CNAME`, hosting account, or deployment authorization;
- credentials, API keys, tokens, private keys, populated `.env` files, or identity selectors;
- populated Shield/Strong Room configuration, production runtime state, host-specific data, logs, or dated operational evidence;
- application business logic, project-specific architecture, data models, authorization decisions, or customer data;
- automatic production authorization.

Projects choose their own approved hosting and deployment arrangements when their infrastructure profile requires them.

## Upgrades and provenance

[TEMPLATE_VERSION](TEMPLATE_VERSION) identifies the integrated template release. [FOUNDATION_VERSIONS](FOUNDATION_VERSIONS) records the exact upstream revisions assessed for that release. For an upgrade, create a dedicated branch, compare upstream revisions, preserve project-owned decisions, update adoption records and evidence, then rerun affected gates.

See [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md) for the upgrade procedure and [Documentation Index](docs/INDEX.md) for the complete document map.

## Security boundary

No template, selected baseline, completed checklist, or passing validator proves a project secure. Each project independently configures and verifies its applicable controls, obtains human authorization for production-impacting work, and keeps sensitive material out of version control.
