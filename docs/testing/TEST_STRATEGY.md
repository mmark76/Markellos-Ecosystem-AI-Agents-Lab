# Test Strategy

This DNA template plans how a project demonstrates `ENG-TEST-001` and other applicable Engineering Standards and Shield requirements. It does not define an independent testing or security standard.

## Objectives
Define what confidence each test level must provide.

## Test Levels

| Level | Scope | Required for | Command | Evidence |
|---|---|---|---|---|
| Unit | Pure units and rules | All critical logic |  |  |
| Component | UI or service components | Applicable projects |  |  |
| Integration | Boundaries and dependencies | Critical integrations |  |  |
| API | Contracts and authorization | API projects |  |  |
| End-to-end | Critical user journeys | Release blockers |  |  |
| Security | Threats and controls | Risk-based |  |  |
| Accessibility | User-facing interfaces | Applicable projects |  |  |
| Performance | Capacity and latency | NFR-driven |  |  |
| Recovery | Backup and restore | Production systems |  |  |

## Quality Gates
- Formatting:
- Linting:
- Type checking:
- Build:
- Static analysis:
- Dependency scan:
- Secret scan:

## Framework Canonical Dashboard Shell

This repository's static canonical shell has no dependency manifest or build
step. Its required dependency-free source checks are:

```powershell
node --check dashboard.js
node --test tests/dashboard-shell.test.cjs
```

The test suite covers build formatting, real-SHA population, `Europe/Nicosia`
winter/summer DST behavior, appearance validation and storage scope, canonical
header order, Settings and Info contents, exact footer structure, user-facing
GitHub absence, unsafe DOM-injection primitives, local script provenance,
responsive source contracts, and required accessibility semantics.

Browser verification remains mandatory for interactions, persistence after
reload, focus/Escape behavior, console errors, responsive overflow, text
scaling, contrast, and visual QA.

## Failure Rules
- Never hide a failing test.
- Never delete or weaken a valid test merely to obtain green status.
- Flaky tests must be repaired, quarantined with approval, or treated as incomplete evidence.
