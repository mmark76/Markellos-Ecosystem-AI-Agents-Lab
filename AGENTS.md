<!-- BEGIN SHARED GLOBAL CODEX RULES v1.0.0 -->

# Global Codex Working Rules

Global Codex Rules Version: 1.0.0

## 1. Scope

These are my default working rules for Codex across all repositories and projects.

They define general Git safety, protection of existing work, change discipline, verification, security, and completion behavior.

Repository-specific and more deeply nested instructions may specialize or override these defaults when they conflict.

Do not place project-specific architecture, domain rules, product requirements, engineering assumptions, UI rules, or repository-specific commands in this global ruleset.

## 2. Instruction Priority

Apply instructions according to authority and specificity.

In general:

1. Direct system, developer, and user instructions for the current task.
2. The most specific applicable nested project instructions.
3. Repository-specific instructions.
4. These shared global defaults.

A more specific valid instruction overrides a broader default when they conflict.

Do not silently resolve a material ambiguity involving safety, scope, user work, data, or destructive operations.

If the correct action remains materially ambiguous, stop and report `NEEDS_DECISION`.

## 3. Git Synchronization Preflight

Before modifying files in a Git repository, determine the actual Git state.

When a remote is available:

1. Identify the repository path.
2. Identify the current branch.
3. Record the current `HEAD`.
4. Run `git fetch` for the relevant remote, normally `origin`.
5. Identify the relevant remote-tracking branch and SHA.
6. Inspect the working tree for:
   - modified files,
   - staged files,
   - untracked files.
7. Determine whether the relevant local branch is:
   - synchronized,
   - ahead,
   - behind,
   - diverged,
   - or has no usable upstream.

Never assume the local checkout is current.

`git fetch` updates remote-tracking information only.
It is not authorization to modify, merge, discard, or rewrite local work.

## 4. Git State Handling

### Clean and synchronized

Proceed normally.

### Clean but behind

Do not automatically merge or rebase simply because the local branch is behind.

Use the correct verified task base.

Where practical, prefer isolated task work based on the intended current remote state rather than modifying unrelated local history.

### Ahead / unpushed commits

Preserve existing commits.

Do not discard, rewrite, hide, or overwrite them.

Determine whether they belong to the current task before proceeding.

### Dirty working tree

Preserve all modified, staged, and untracked user work.

Do not assume existing changes belong to the current task.

If safe isolation is practical, use an isolated branch or worktree.

If the requested work overlaps existing changes or safe isolation is not possible, stop and report the situation.

### Diverged history

Do not automatically reconcile diverged history.

Do not automatically merge, rebase, reset, or force-update.

Stop and report unless repository-specific instructions explicitly define an approved procedure.

### Remote unavailable

Do not claim synchronization was verified.

Report that remote state could not be checked.

Continue only when the requested work can safely proceed from the known state.

## 5. Protection of Existing Work

Preserving existing user work has priority over convenience.

Never perform destructive or potentially destructive operations on existing work without clear authorization.

Unless specifically authorized, do not:

- run `git reset --hard`,
- discard working-tree changes,
- delete untracked user files,
- overwrite local changes with checkout/restore operations,
- destructively delete branches,
- force push,
- rewrite published history,
- automatically stash and later drop user work,
- rebase existing user commits,
- overwrite local work merely to match the remote.

When uncertain whether data or work is disposable, treat it as valuable.

## 6. Branch and Pull Request Discipline

For significant repository changes:

- start from the correct verified base,
- use a dedicated task branch,
- keep the branch focused on one coherent task,
- use a Pull Request when the repository workflow supports it.

Do not directly modify the default branch for significant work unless explicitly authorized or repository-specific rules allow it.

Do not merge a Pull Request unless the current task explicitly authorizes the merge.

Do not force-push unless explicitly authorized.

## 7. Scope Discipline

Implement the smallest coherent change that satisfies the requested task.

Do not automatically introduce:

- unrelated refactoring,
- speculative improvements,
- architecture rewrites,
- unrelated dependency upgrades,
- mass formatting changes,
- optional features,
- opportunistic cleanup,
- unrequested redesigns,
- future-proofing without a concrete requirement.

If useful unrelated work is discovered, report or record it separately.

Do not silently expand scope.

## 8. Repository Authority

Before significant work, inspect the repository's applicable instructions and source-of-truth documents.

Preserve established:

- architecture,
- terminology,
- workflows,
- conventions,
- project decisions,
- requirement status,
- documented assumptions,

unless the task explicitly requires changing them.

Do not silently reconcile conflicting repository documents.

Report material conflicts.

Repository-specific rules may override these global defaults.

## 9. Change Quality

Prefer:

- small understandable changes,
- clear responsibilities,
- readable code and documentation,
- existing repository patterns,
- root-cause fixes,
- existing approved tools,
- minimal complexity.

Do not introduce complexity merely to make a solution appear more sophisticated.

## 10. Commits

When committing changes:

- keep commits logically focused,
- use descriptive commit messages,
- do not mix unrelated changes,
- inspect staged content before committing,
- do not include local-only or generated files unless required.

Do not claim a commit contains only a particular scope without checking it.

## 11. Verification

Never claim that a command, test, build, lint, typecheck, scan, synchronization check, deployment, or other verification passed unless it was actually executed successfully.

Before declaring significant work complete:

1. inspect the final diff,
2. run relevant repository-defined checks,
3. verify affected behavior where practical,
4. inspect for unintended changes,
5. report any checks that could not be run.

If no relevant automated checks exist, state that explicitly.

Do not replace missing verification with assumptions.

## 12. Security and Secrets

Never intentionally commit or expose:

- passwords,
- API keys,
- access tokens,
- private keys,
- credentials,
- authentication cookies,
- secret environment values.

Use approved secret-management mechanisms.

Do not weaken security controls merely to make a task pass.

If sensitive information is discovered, avoid reproducing it unnecessarily and report the issue safely.

## 13. Dependencies and Tooling

Do not introduce a new dependency, framework, build system, service, or external tool when the task can be completed cleanly with the repository's existing stack.

When a new dependency is genuinely necessary:

- justify it,
- keep it minimal,
- prefer maintained and established options,
- follow repository-specific dependency policies.

## 14. External and Consequential Actions

Repository modification does not automatically authorize unrelated consequential external actions.

Do not assume authorization for actions such as:

- production deployment,
- DNS changes,
- cloud-resource deletion,
- production database migration,
- Pull Request merge,
- release publication,
- force push.

Perform such actions only when clearly authorized by the current task or applicable repository-specific instructions.

## 15. Truthfulness and Uncertainty

Never invent:

- command results,
- Git state,
- test results,
- deployment state,
- external-system state,
- project data,
- approvals,
- requirements.

Distinguish clearly between:

- observed facts,
- repository-defined facts,
- assumptions,
- inferences,
- unavailable information.

When uncertainty materially affects correctness or safety, report it.

## 16. Completion

Before declaring `COMPLETE`, verify that:

- requested scope is implemented,
- relevant checks passed or their absence is reported,
- the final diff was reviewed,
- no known existing user work was overwritten,
- no unresolved blocker prevents the requested outcome,
- no unrelated work was silently introduced.

If work cannot safely continue, use:

- `BLOCKED`, or
- `NEEDS_DECISION`

as appropriate.

Do not present partial or unverified work as complete.

## 17. Final Report

For significant tasks, report concisely:

- starting state / verified base,
- branch used,
- files changed,
- verification performed,
- known limitations,
- blockers or decisions required,
- Pull Request status where applicable,
- deployment status where applicable,
- final state.

Never hide failed checks, uncertainty, conflicts, or deviations.

<!-- END SHARED GLOBAL CODEX RULES -->

Repository-specific instructions below specialize these shared defaults and take precedence when they conflict. More deeply nested applicable Codex instruction files remain more specific.


# AGENTS.md

## 1. Mission

Build the smallest secure, maintainable, testable, extensible, and consistently usable solution that fully satisfies the approved release scope.

Optimize for verified requirements, architectural health, security, accessibility, UI/UX coherence, clarity, and controlled completion—not theoretical perfection.

### Foundation Authority

This repository is the Markellos Ecosystem AI Agents Lab project. Use [Ecosystem Framework — The DNA](https://github.com/mmark76/ecosystem-framework) for lifecycle adoption methods, [Ecosystem Engineering Standards](https://github.com/mmark76/Ecosystem-Engineering-Standards/blob/main/ENGINEERING-REQUIREMENTS.md) for cross-cutting `ENG-*` requirements, Ecosystem Security — The Shield for security requirements and controls, and [Ecosystem Infrastructure](https://github.com/mmark76/ecosystem-infrastructure) for shared infrastructure mechanisms. These sources remain authoritative; this repository records only its project-specific adoption and evidence.

Before copying any Shield material, confirm the target repository visibility and the source material's distribution classification. Never copy credentials, populated configurations, host-specific sensitive information, or private operational evidence.

## 2. Required Reading Order

Before planning or changing code, read the relevant files:

1. `docs/product/PROJECT_BRIEF.md`
2. `docs/product/RELEASE_SCOPE.md`
3. `checklists/INITIALIZATION_GATE.md` during project initialization
4. `docs/requirements/OBJECTIVES.md`
5. `docs/requirements/ACCEPTANCE_CRITERIA.md`
6. `docs/requirements/TRACEABILITY_MATRIX.md`
7. `ARCHITECTURE_RULES.md`
8. `SECURITY_RULES.md`
9. `UI_UX_RULES.md`
10. `docs/design/UI_UX_DESIGN_SYSTEM.md` for user-facing work
11. `PROJECT_DASHBOARD_GUIDE.md` for dashboards, landing pages, project-status pages, and main web interfaces
12. `DEFINITION_OF_DONE.md`
13. `COMPLETION_AND_STOP_PROTOCOL.md`
14. `CHANGE_CONTROL.md`

Project-specific decisions may specialize these generic rules. They must not silently weaken mandatory architecture, security, accessibility, UI/UX, dashboard identity, evidence, or completion requirements.

## 3. Mandatory Task Protocol

For every task:

1. For a newly created project, pass `checklists/INITIALIZATION_GATE.md` before development readiness.
2. Identify the approved objective, requirement, defect, risk, or maintenance ID.
3. Inspect the affected architecture, data flow, trust boundaries, dependencies, and user experience.
4. Plan the smallest coherent change.
5. Avoid unrelated refactors and speculative improvements.
6. Implement within the correct module and layer.
7. Reuse approved design tokens and components for user-facing work.
8. Add or update appropriate tests.
9. Run the required checks.
10. Update documentation and the traceability matrix.
11. Record evidence, deviations, risks, and deferred ideas.
12. Stop when the assigned acceptance criteria pass.

Every code change must be traceable to an approved ID.

## 4. Scope Discipline

Do not introduce automatically:

- unrequested features,
- speculative abstractions,
- premature generalization,
- unrelated cleanup,
- architecture rewrites,
- unapproved visual redesigns,
- future-proofing not justified by an approved requirement,
- optional enhancements during completion work.

When a useful future improvement is discovered:

1. Do not implement it automatically.
2. Record it in `FUTURE_BACKLOG.md`.
3. Continue the approved task.

## 5. Architecture Discipline

Identify applicable Engineering Standards IDs and preserve their project-specific implementation through:

- one clear responsibility per unit,
- feature-based or domain-based organization,
- explicit module boundaries,
- low coupling and high cohesion,
- small public interfaces,
- one-way dependency flow,
- separation of presentation, application, domain, and infrastructure concerns,
- human-readable and searchable code,
- replaceable external providers where replacement risk is meaningful.

Treat the following as blocking implementation conditions unless the applicable Engineering Standards requirement has an approved project exception:

- circular dependencies,
- deep imports into another module's internals,
- business rules hidden in UI components,
- duplicated business rules,
- secrets in source control,
- uncontrolled global mutable state,
- temporary patches represented as final solutions,
- silent architecture deviations.

## 6. Root-Cause Protocol

When fixing a defect:

1. Reproduce it.
2. Identify the root cause.
3. Identify the responsible module.
4. Add a failing regression test when practical.
5. Apply a structural fix.
6. Run affected and regression tests.
7. Inspect side effects.
8. Document the result.

Do not stack conditions, overrides, or patches without addressing the underlying cause.

## 7. Security Discipline

- Identify the applicable Shield standards, requirement IDs, control baselines, and accepted revisions for the approved scope and risk.
- Record project-specific threats, controls, owners, verification methods, evidence, risks, and exceptions in the DNA project records.
- Keep populated configuration and sensitive operational evidence in the adopting project or another approved protected location.
- Use `SECURITY_RULES.md` for the adoption workflow and `checklists/SECURITY_GATE.md` for the project verification decision.
- Treat an unsatisfied critical Shield requirement or unapproved critical exception as a blocking condition and escalate it to the responsible owner.

## 8. UI/UX and Accessibility Discipline

For every user-facing change:

- follow `UI_UX_RULES.md`,
- use `design-system/tokens/tokens.json` or an approved generated adapter,
- select one approved app theme,
- reuse shared components before creating variants,
- keep application and domain logic outside visual components,
- define loading, empty, error, offline, and success states where applicable,
- preserve responsive behavior across narrow, medium, and wide layouts,
- verify keyboard, focus, contrast, text scaling, touch targets, and reduced motion,
- support Greek and English content without layout assumptions,
- record screenshots or equivalent evidence for material visual changes,
- document every deviation in `docs/governance/EXCEPTIONS.md`.

For dashboards, landing pages, project-status pages, and main web interfaces, also follow `PROJECT_DASHBOARD_GUIDE.md`. Preserve its shared project identity pattern, simple primary navigation, ecosystem return link where applicable, stable footer, copyright information, and visible version/build identification unless an approved project-specific requirement justifies a documented deviation.

Accessibility failures and silent design-system or dashboard-guide deviations are defects.

## 9. Project Commands

```text
FORMAT_COMMAND=Not applicable — no formatter is configured; preserve repository formatting and run git diff --check
LINT_COMMAND=node --check dashboard.js && node --check apps/ai-lab-landing/build.cjs && node --check apps/local-ai-agents-lab/scripts/build-release.cjs
TYPECHECK_COMMAND=Not applicable — JavaScript and Python have no configured static type-check layer
UNIT_TEST_COMMAND=node --test apps/ai-lab-landing/tests/build.test.cjs apps/local-ai-agents-lab/tests/build-release.test.cjs && py -3 -m unittest discover -s apps/local-ai-agents-lab/tests
INTEGRATION_TEST_COMMAND=Manual local loopback check documented in docs/testing/TEST_STRATEGY.md
E2E_TEST_COMMAND=Manual browser and Cloudflare preview checks documented in docs/testing/TEST_STRATEGY.md
ACCESSIBILITY_TEST_COMMAND=Manual keyboard, responsive, contrast, and text-scaling check for the public landing page
SECURITY_SCAN_COMMAND=node scripts/validate-foundations.cjs
DEPENDENCY_SCAN_COMMAND=Not applicable — no third-party runtime packages are installed by the Local Lab or landing page
BUILD_COMMAND=node apps/ai-lab-landing/build.cjs && node apps/local-ai-agents-lab/scripts/build-release.cjs HEAD <output-directory>
```

Never claim a command passed unless it was actually run successfully, or an approved exception explicitly records why it was not required.

The public landing page and Local Lab have separate boundaries. Never expose the Local Lab, Ollama, or its SQLite data through the public landing deployment.

## 10. Repair Limits

Default limits unless the project defines stricter ones:

- same failing check: maximum 3 repair attempts,
- same architecture rework loop: maximum 2 cycles,
- unresolved requirement interpretation: maximum 1 attempt before escalation.

When a limit is reached, stop and report `BLOCKED` or `NEEDS_DECISION`.

## 11. Allowed Terminal States

- `COMPLETE`: assigned task criteria passed.
- `BLOCKED`: required access, information, dependency, or capability is unavailable.
- `NEEDS_DECISION`: an owner decision is required.
- `CHANGE_REQUEST`: completion requires changing the approved scope.
- `RELEASE_COMPLETE`: the final release completion gate passed.

## 12. Final Stop Rule

Declare `RELEASE_COMPLETE` only when:

- 100% of mandatory in-scope objectives are verified,
- 100% of blocking acceptance criteria pass,
- all mandatory tests and gates pass,
- open blockers equal zero,
- unaccepted critical risks equal zero,
- unapproved deviations equal zero,
- all required evidence is present,
- optional and future work is recorded outside the current release.

After declaring `RELEASE_COMPLETE`, stop modifying the repository. Do not perform additional cleanup, refactoring, optimization, feature work, or speculative improvement without a new approved task.

## 13. Required Final Report

Report:

- objectives and requirements completed,
- files changed,
- tests and checks run,
- security checks performed,
- architecture impact,
- UI/UX and accessibility impact,
- evidence produced,
- known limitations,
- deferred items,
- blockers or deviations,
- final state.

Never hide failed checks, assumptions, incomplete evidence, or uncertainty.
