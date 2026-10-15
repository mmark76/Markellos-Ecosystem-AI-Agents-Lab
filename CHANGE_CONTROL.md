# Change Control

## Approved change record — AI-LAB-CC-049

```text
Change ID: AI-LAB-CC-049
Requested by: Repository maintainer
Date: 2026-10-15
Description: Prepare a provider-independent remote NVIDIA GPU LoRA smoke-test contract, host readiness probe, worker reliability evidence, and procedure while retaining the production training lock.
Reason: Verify the shared worker on an explicitly approved future GPU host without binding the training engine to the Windows laptop or a cloud provider.
Affected objective IDs: AI-LAB-OBJ-006
Architecture impact: Adds file-based job-contract and readiness modules used by the directly executable worker; no remote executor, provider integration, public endpoint, or Local Lab activation is added.
Security and privacy impact: No credentials, remote commands, uploads, paid resources, or network execution are introduced; the HTTP 423 lock remains required.
Data impact: Future synthetic datasets, staged models, and adapter outputs remain external to Git and SQLite histories.
Testing impact: Add mocked contract/readiness/failure lifecycle tests and retain locked-route plus existing Local Lab regressions; real CUDA verification remains pending.
Cost and schedule impact: No cloud resources are started. A later smoke test requires explicit approval for a GPU host, dependency installation, model source/license, artifact staging, and execution.
Decision: APPROVED (PREPARATION ONLY)
Approved by: Direct user request
Target release: Developer preparation only; no production release activation
```

## Approved change record ? AI-LAB-CC-048

```text
Change ID: AI-LAB-CC-048
Requested by: Repository maintainer
Date: 2026-10-15
Description: Add independent Evaluation Lab API/UI integration to the local application using completed Training Room snapshot inputs and Phase 2 execution contracts.
Reason: Enable explicit local evaluation and inspection of model-qualified scorecards and findings without coupling or writing to legacy rooms.
Affected objective IDs: AI-LAB-OBJ-017
Architecture impact: Add EvaluationHTTPService module, narrow same-origin API dispatch in server.py, new standalone Evaluation Lab JS/CSS and navigation UI.
Security and privacy impact: Fixed loopback host/Origin checks preserved, bounded request validation, only configured installed Ollama model, no external provider or telemetry.
Data impact: Additive Evaluation Lab tables initialized after legacy schema migrations. Only Evaluation Lab tables receive new run/results; completed Training Room records are read-only.
Testing impact: Mocked HTTP integration, real engine through a mocked local adapter, full Python/Node regression and foundation checks; manual local browser UI review remains pending.
Decision: APPROVED (SCOPE INCREASE)
Approved by: Direct user request
Target release: Unreleased v2.0.0 development branch; no package, merge or deployment in this phase.
```

## Approved change record — AI-LAB-CC-047

```text
Change ID: AI-LAB-CC-047
Requested by: Repository maintainer
Date: 2026-10-14
Description: Add the independent Evaluation Lab Phase 2 execution engine, fixed-loopback Ollama adapter, immutable-snapshot prompt builder, strict structured-response parser, and atomic assessment persistence.
Reason: Enable local evaluation of recorded Training Room outputs without re-executing, modifying, or coupling to the existing Training Room workflow.
Affected objective IDs: AI-LAB-OBJ-016
Architecture impact: Adds one-way Evaluation Lab execution modules only. Existing server routes, UI, prompts, packaging, Training Room, and Conference Room do not import or depend on these modules.
Security and privacy impact: Uses only the existing fixed 127.0.0.1 Ollama provider; configured model selection is never substituted; requests/responses are bounded; recorded outputs are explicitly untrusted data; no credentials, cloud endpoint, installation, or telemetry is added.
Data impact: Evaluation results, including qualified scorecards and findings, are committed atomically in existing Evaluation Lab tables. Historical Training Room records remain read-only.
Testing impact: Adds mocked local-model execution, structured parsing, timeout, failure, interruption, duplicate-run, provenance, atomicity, and source-isolation regression coverage.
Cost and schedule impact: Local Evaluator inference consumes local device resources only; no package, service, deployment, or release change.
Decision: APPROVED (SCOPE INCREASE)
Approved by: Direct user request
Target release: Unreleased v2.0.0 development branch; no API, UI, package, or deployment action in this phase
```

## Approved change record — AI-LAB-CC-046

```text
Change ID: AI-LAB-CC-046
Requested by: Repository maintainer
Date: 2026-10-14
Description: Establish the first additive Evaluation Lab module: validated contracts, Evaluation Lab-owned SQLite tables, immutable read-only completed Training Room snapshots, provenance-qualified findings, and regression coverage.
Reason: Begin v2.0.0 modular development without changing the stable Conference Room or Training Room workflows, UI, API, prompts, data, or release artifacts.
Affected objective IDs: AI-LAB-OBJ-015
Architecture impact: Adds an independent `evaluation_lab` package with a one-way read dependency on the existing Training Room SQLite schema; no existing module imports it.
Security and privacy impact: Maintains the local-only database boundary; Evaluation Lab writes only its own tables and preserves evidence provenance for model-generated findings.
Data impact: Adds idempotent Evaluation Lab tables and indexes in the existing SQLite database. Historical Training Room tables are read-only to the new module.
Testing impact: Adds temporary-database contract, persistence, source-record preservation, immutable-snapshot, provenance, scorecard-atomicity, and lifecycle-transition tests; existing Local Lab and package regressions remain required.
Cost and schedule impact: No external service, dependency, deployment, package, or release change.
Decision: APPROVED (SCOPE INCREASE)
Approved by: Direct user request
Target release: Unreleased v2.0.0 development branch; no package or deployment action in this phase
```

## Approved change record — AI-LAB-CC-045

```text
Change ID: AI-LAB-CC-045
Requested by: Repository maintainer
Date: 2026-10-14
Description: Retain and publish the verified Windows ZIP archive from v1.0.0 onward through a compact, collapsed release-history control on the public dashboard.
Reason: Preserve the evolution of the agents for future study without presenting a long list of previous versions in the primary dashboard view.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Static public landing presentation and versioned R2 artifact retention only; no Local Lab, model, data, or API changes.
Security and privacy impact: Existing public R2 distribution boundary remains unchanged; every displayed ZIP remains versioned and checksum-identified.
Data impact: Existing public R2 ZIPs are retained; v1.1.0 and v1.1.3 are added as immutable public archive objects.
Testing impact: Extend landing build regression for the complete v1.0.0+ manifest and its collapsed two-column archive.
Cost and schedule impact: Small ongoing R2 storage cost for two additional retained ZIPs.
Decision: APPROVED (SCOPE INCREASE)
Approved by: Direct user request
Target release: Next public landing deployment
```

## Rule

After scope freeze, every proposed change must be classified.

## Change Classes

- `DEFECT`: approved behavior is not working.
- `CLARIFICATION`: no material scope change.
- `SCOPE_SWAP`: new item replaces another approved item.
- `SCOPE_INCREASE`: adds time, cost, risk, or deliverables.
- `FUTURE`: deferred to a later release.
- `REJECTED`: not approved.

## Required Change Record

```text
Change ID:
Requested by:
Date:
Description:
Reason:
Affected objective IDs:
Architecture impact:
Security and privacy impact:
Data impact:
Testing impact:
Cost and schedule impact:
Decision:
Approved by:
Target release:
```

AI agents must not approve their own material scope increases.

## Approved change record — AI-LAB-CC-043

```text
Change ID: AI-LAB-CC-043
Requested by: Repository maintainer
Date: 2026-10-13
Description: Keep the three newest verified Windows ZIP releases available and visible on the public landing page.
Reason: Let users download a recent release while retaining two prior verified packages for compatibility and rollback.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: The static distribution manifest becomes a three-entry ordered release history rendered by the landing-page build; the Local Lab runtime is unchanged.
Security and privacy impact: Every listed R2 URL remains versioned and carries its SHA-256; no new endpoint, credential, or visitor data is added.
Data impact: Three public ZIP objects are retained in R2.
Testing impact: Landing build regression verifies exactly three ordered, validated release entries and their rendered links/checksums.
Cost and schedule impact: Small ongoing R2 storage cost for two retained historical ZIPs.
Decision: APPROVED (SCOPE INCREASE)
Approved by: Direct user request on 2026-10-13
Target release: Next public landing deployment
```

## Approved change record — AI-LAB-CC-041

```text
Change ID: AI-LAB-CC-041
Requested by: Repository maintainer
Date: 2026-10-13
Description: Add Copy and Share controls below each generated agent response in the private Local Lab discussion history.
Reason: Let the user reuse or explicitly share an individual agent response without selecting text manually.
Affected objective IDs: AI-LAB-OBJ-011
Architecture impact: Local presentation behavior only in the message renderer; no server route, model workflow, or database schema change.
Security and privacy impact: Copy stays in the local clipboard. Share invokes only the browser's native user-initiated share action; unsupported browsers copy the response locally instead. No automatic transmission, telemetry, or remote endpoint is added.
Data impact: None.
Testing impact: Add static regression coverage for agent-only controls, clipboard fallback, native share use, and accessible target sizing.
Cost and schedule impact: None.
Decision: APPROVED (SCOPE INCREASE)
Approved by: Direct user request on 2026-10-13
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-044

```text
Change ID: AI-LAB-CC-044
Requested by: Repository maintainer
Date: 2026-10-13
Description: Preserve each four-stage response panel's vertical scroll position when the local Training Lab refreshes session status.
Reason: Polling replaced completed response elements and returned manually scrolled content to the top.
Affected objective IDs: AI-LAB-OBJ-011
Architecture impact: Local presentation rendering only; stage execution, provider routing, prompts, and stored responses are unchanged.
Security and privacy impact: None; no endpoint, storage, credential, or telemetry change.
Data impact: None.
Testing impact: Add a static regression assertion and manually verify independent response-panel scrolling in the local browser.
Cost and schedule impact: None.
Decision: APPROVED (DEFECT)
Approved by: Direct user request on 2026-10-13
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-042

```text
Change ID: AI-LAB-CC-042
Requested by: Repository maintainer
Date: 2026-10-13
Description: Let the Training Topic composer scroll with the discussion history instead of remaining fixed above an independently scrolling conversation panel.
Reason: The user prefers one continuous conversation flow.
Affected objective IDs: AI-LAB-OBJ-011
Architecture impact: Local CSS layout behavior only; no server route, model workflow, or database schema change.
Security and privacy impact: None.
Data impact: None.
Testing impact: Replace the independent-conversation-scroll assertion with a regression check for workspace-level scrolling.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request on 2026-10-13
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-039

```text
Change ID: AI-LAB-CC-039
Requested by: Repository maintainer
Date: 2026-10-13
Description: Expand the public README / Installation Guide in English with a beginner Quick Start, explanations of the three Windows BAT launchers, and a technical documentation section that preserves the existing detailed public README.
Reason: Give new users a reliable first-install path while retaining technical instructions and truthful current-feature status.
Affected objective IDs: AI-LAB-OBJ-001, AI-LAB-OBJ-003
Architecture impact: Static landing-page documentation and existing guide link only; no Local Lab code, ZIP artifact, deployment settings, or provider changes.
Security and privacy impact: Clarifies first-use network requirements, local-only boundaries, and Ollama cloud-disable configuration; no new APIs, credentials, telemetry, or connections.
Data impact: None.
Testing impact: Extend the existing landing build regression to cover the README link, BAT explanations, offline caveats, and retained technical sections.
Cost and schedule impact: Limited documentation and regression update; production publication requires separate verification.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request on 2026-10-13
Target release: Next controlled public landing-page deployment
```

## Approved change record — AI-LAB-CC-038

```text
Change ID: AI-LAB-CC-038
Requested by: Repository maintainer
Date: 2026-10-13
Description: Add an optional Model Guidance modal beside the four Learning Lab model selectors.
Reason: Help users compare vendor-neutral role needs, indicative model sizes, and general hardware considerations without changing their local model choices.
Affected objective IDs: AI-LAB-OBJ-013
Architecture impact: Static presentation data and modal controller only; no backend API, provider, prompt, model assignment, or execution-flow change.
Security and privacy impact: No hardware detection, telemetry, network request, credential, installation, download, or configuration change.
Data impact: None.
Testing impact: Add static role/content/accessibility and package-inclusion regression coverage; retain existing local model-selection tests.
Cost and schedule impact: None.
Decision: APPROVED (SCOPE INCREASE)
Approved by: Direct user request on 2026-10-13
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-040

```text
Change ID: AI-LAB-CC-040
Requested by: Repository maintainer
Date: 2026-10-13
Description: Add consent-gated GA4 measurement to the public Cloudflare Pages landing page, including page/navigation and ZIP-download events, privacy information, and withdrawal controls.
Reason: The owner requires traffic, geographic, acquisition, engagement, and Windows ZIP-download reporting for the public guide.
Affected objective IDs: AI-LAB-OBJ-014
Architecture impact: Adds a small first-party landing-page analytics adapter and narrowly expands the Pages CSP. The Local Lab, Ollama, training, SQLite, and release package remain outside the change.
Security and privacy impact: Google Analytics is never loaded before explicit consent. Consent Mode v2 signals, a non-sensitive event allowlist, Reject, and withdrawal controls reduce collection to the approved public-site scope.
Data impact: Stores one analytics-consent preference in browser local storage. GA4 receives only standard website analytics and `zip_download` metadata after consent; no Local Lab or sensitive data is sent.
Testing impact: Add landing build/source assertions and perform local browser network checks; GA4 DebugView is optional when property access is available.
Cost and schedule impact: No new runtime dependency or production deployment action.
Decision: APPROVED (SCOPE_INCREASE)
Approved by: Direct user request
Target release: Next public landing deployment
```

## Approved change record — AI-LAB-CC-037

```text
Change ID: AI-LAB-CC-037
Requested by: Repository maintainer
Date: 2026-10-13
Description: Remove retired institutional terminology from all user-visible and internal project identifiers.
Reason: The approved project name is Markellos Ecosystem AI Agents Lab.
Affected objective IDs: AI-LAB-OBJ-003, AI-LAB-OBJ-007, AI-LAB-OBJ-012
Architecture impact: Rename the active training-room identifier to `training`; initialize migrates pre-existing local message records to the new identifier before normal operation.
Security and privacy impact: No new endpoint, remote service, credential, or data collection. The local SQLite migration changes only the room label while preserving records.
Data impact: Existing local training history remains accessible after a one-way local room-label migration.
Testing impact: Update package, shell, and server tests; add regression coverage that retired branding is absent from user-visible Local Lab sources.
Cost and schedule impact: Requires a new Windows ZIP release and public dashboard metadata deployment.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request on 2026-10-13
Target release: v0.1.30
```

## Approved change record — AI-LAB-CC-036

```text
Change ID: AI-LAB-CC-036
Requested by: Repository maintainer
Date: 2026-10-13
Description: Implement a beginner-facing Windows Easy Start bootstrap in the released ZIP.
Reason: Beginners need a direct setup path while retaining explicit, informed control of every device-changing installation action.
Affected objective IDs: AI-LAB-OBJ-012
Architecture impact: Adds a packaged launcher and a fixed-boundary PowerShell readiness flow before the existing loopback server launcher; inference and Local Lab runtime behavior are unchanged.
Security and privacy impact: Default-No confirmations are separate for Python installation, Ollama installation, starting Ollama, and downloading the fixed initial local model. The flow permits only fixed winget IDs and fixed loopback Ollama paths; it adds no telemetry, arbitrary URL, credential, or public route.
Data impact: None. Existing local Lab data is reused unchanged.
Testing impact: Add source/package consent-boundary regression tests and a PowerShell parser check; clean Windows smoke testing remains required before release verification.
Cost and schedule impact: New ZIP release, public distribution update, and deployment verification are required.
Decision: APPROVED (SCOPE INCREASE)
Approved by: Direct user request on 2026-10-13
Target release: v0.1.29
```

## Approved change record — AI-LAB-CC-035

```text
Change ID: AI-LAB-CC-035
Requested by: Repository maintainer
Date: 2026-10-13
Description: Replace the Local Lab UI build identifier with an explicit ZIP version label generated from the packaged VERSION file.
Reason: Let users directly confirm which Windows ZIP release they installed without interpreting an internal timestamp and commit identifier.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Release-presentation stamping and package verification only; runtime behavior is unchanged.
Security and privacy impact: None.
Data impact: None.
Testing impact: Add a source and package-verifier regression test for the ZIP version label.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-034

```text
Change ID: AI-LAB-CC-034
Requested by: Repository maintainer
Date: 2026-10-13
Description: Put the Training Topic form ahead of the scrollable training history, display a BETA badge above the Local Lab lockup, temporarily disable Agent Collaboration navigation while retaining its implementation, and show resolved local model and JSONL dataset directories with copy and Windows folder-opening actions.
Reason: Clarify the primary Agent Training workflow, prevent entry into incomplete collaboration work, and make optional local-training inputs discoverable after installation.
Affected objective IDs: AI-LAB-OBJ-006, AI-LAB-OBJ-007
Architecture impact: Presentation layout and training-directory adapter only; the existing collaboration flow remains implemented and inference, training execution, provider routing, and SQLite history are unchanged.
Security and privacy impact: Directory paths are resolved only from the application root. The folder action accepts one fixed allowlisted directory name over the existing loopback, same-origin write boundary; no arbitrary filesystem path, network endpoint, credential, or telemetry is added.
Data impact: None. Existing conversation history, model compatibility rules, and JSONL validation remain unchanged.
Testing impact: Add source layout/navigation regression checks and service checks for resolved directory paths and allowlisted Windows folder opening.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-033

```text
Change ID: AI-LAB-CC-033
Requested by: Repository maintainer
Date: 2026-10-12
Description: Remove the Local Lab's fixed inference read deadline and make Learning Lab sessions persisted, pollable, and stage-visible.
Reason: A slow local Trainer could exceed the 150-second application deadline and return the UI to idle without a visible diagnosis or a saved response.
Affected objective IDs: AI-LAB-OBJ-004, AI-LAB-OBJ-010
Architecture impact: The fixed-loopback Ollama adapter keeps bounded discovery checks but waits indefinitely for inference; Learning Lab uses a local worker plus SQLite session state and a loopback polling endpoint.
Security and privacy impact: No remote endpoint, credential, or prompt logging is added. Diagnostics contain only session, role, model, stage, duration, and error type.
Data impact: A backward-compatible training_sessions migration records status, stage, concise error text, per-agent duration, and completion time. Existing messages and sessions remain intact.
Testing impact: Add regression coverage for no inference read deadline, independent model routing, completed stages, and saved partial results after a Student failure.
Cost and schedule impact: None.
Decision: APPROVED (DEFECT)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-006

```text
Change ID: AI-LAB-CC-006
Requested by: Repository maintainer
Date: 2026-10-11
Description: Optional isolated local PyTorch LoRA/SFT training workspace with CUDA detection.
Reason: Extend the Local Lab from inference to controlled local model improvement.
Affected objective IDs: AI-LAB-OBJ-006
Architecture impact: New training boundary; inference and SQLite remain unchanged.
Security and privacy impact: Local enumerated paths only; no remote downloads or cloud resources.
Data impact: JSONL datasets and adapters remain untracked outside SQLite.
Testing impact: Add deterministic training, CUDA, packaging, and inference-regression checks.
Cost and schedule impact: User-controlled local compute only; no billable resource.
Decision: APPROVED
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-033

```text
Change ID: AI-LAB-CC-033
Requested by: Repository maintainer
Date: 2026-10-12
Description: Expand Learning Lab from two agents to a Trainer, Student, Evaluator, Improver cycle with independently selected local Ollama models and durable per-stage progress.
Reason: The owner requested a complete evidence-oriented learning loop that keeps all local inference strictly serial and supports slow CPU operation.
Affected objective IDs: AI-LAB-OBJ-011
Architecture impact: Adds a locked session worker, backward-compatible SQLite stage records, role-specific prompts, and polling-only presentation state. Conference Room behavior remains unchanged.
Security and privacy impact: Fixed loopback Ollama is retained; no cloud provider, browser-supplied endpoint, credentials, or external storage is added.
Data impact: Existing messages and two-role sessions remain readable. New sessions persist four model snapshots and stage status, timing, output, assessment metadata, and errors.
Testing impact: Mocked serial routing, no-overlap, unload, slow/unbounded inference contract, failure, cancellation, migration, HTTP, and UI regression coverage.
Cost and schedule impact: Four inference stages can take substantial time on CPU; the Lab deliberately does not impose an inference duration limit.
Decision: APPROVED (SCOPE INCREASE)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-012

```text
Change ID: AI-LAB-CC-012
Requested by: Repository maintainer
Date: 2026-10-12
Description: Make the public landing page default background fully black in the Local Lab style while retaining user-selectable button accent and appearance colours.
Reason: Align the public guide's default visual appearance with the Local Lab.
Affected objective IDs: AI-LAB-OBJ-005
Architecture impact: Default presentation tokens and appearance preference defaults only.
Security and privacy impact: None; local validated appearance storage remains unchanged.
Data impact: Existing saved browser appearance preferences remain user-controlled.
Testing impact: Landing build regression verifies the dark default and retained appearance controls.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next public landing deployment
```

## Approved change record — AI-LAB-CC-023

```text
Change ID: AI-LAB-CC-023
Requested by: Repository maintainer
Date: 2026-10-12
Description: Repair the Local Lab three-panel resize and hide/show controls with wider handles, window-level pointer tracking, and clear toggle labels.
Reason: The initial three-panel implementation was not operable for the user in the released Local Lab.
Affected objective IDs: AI-LAB-OBJ-007
Architecture impact: Local presentation interaction only; model routing, SQLite history, training, and provider boundaries are unchanged.
Security and privacy impact: None; no endpoint, storage, or external connection is added.
Data impact: Stored panel width preferences remain browser-local.
Testing impact: Add regression assertions for global pointer completion and labelled panel controls.
Cost and schedule impact: None.
Decision: APPROVED (DEFECT)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-011

```text
Change ID: AI-LAB-CC-011
Requested by: Repository maintainer
Date: 2026-10-12
Description: Add an explicit landing-page notice that ZIP upgrades are manual, not required at every startup, and require preserving local models and SQLite history.
Reason: Ensure users understand the safe update procedure.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Public instructional copy and regression assertion only.
Security and privacy impact: Reinforces user-controlled upgrades and local data preservation.
Data impact: Documents backup of local SQLite history; no data migration.
Testing impact: Landing build regression asserts the notice.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next public landing deployment
```

## Approved change record — AI-LAB-CC-009

```text
Change ID: AI-LAB-CC-009
Requested by: Repository maintainer
Date: 2026-10-11
Description: Publish a refreshed Windows release and add a manual safe update-check control.
Reason: The available public ZIP predates the recent Local Lab fixes and users need a trustworthy way to discover a newer package.
Affected objective IDs: AI-LAB-OBJ-009
Architecture impact: One isolated release-metadata adapter; installation remains outside the application.
Security and privacy impact: Explicit request only, fixed official endpoint, bounded response, validated links, no automatic download/install/launch.
Data impact: None; existing SQLite history and local models are not touched.
Testing impact: Add mocked endpoint/link validation plus UI and package regression checks.
Cost and schedule impact: Optional small metadata request; manual upgrade remains user-controlled.
Decision: APPROVED (SCOPE_INCREASE)
Approved by: Direct user request
Target release: Local Lab 0.1.2
```

## Approved change record — AI-LAB-CC-010

```text
Change ID: AI-LAB-CC-010
Requested by: Repository maintainer
Date: 2026-10-12
Description: Emphasize that the public Open Local Lab link is used only after start-windows.bat has started the Lab from the extracted ZIP folder; remove the public GR/EN language selector.
Reason: Prevent users from expecting the browser link to launch the local server and remove the unrequested language control.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Public instructional copy, presentation control removal, and regression assertions only.
Security and privacy impact: Reinforces the public-guide/local-runtime boundary; no data or endpoint change.
Data impact: None.
Testing impact: Landing-page build regression asserts the prerequisite and non-launch behavior.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next public landing deployment
```

## Approved change record — AI-LAB-CC-007

```text
Change ID: AI-LAB-CC-007
Requested by: Repository maintainer
Date: 2026-10-11
Description: Hide Interface and Agent responses language selectors in private Local Lab.
Reason: Simplify the UI at the user's request.
Affected objective IDs: AI-LAB-OBJ-007
Architecture impact: Presentation and its JavaScript consumers only; no backend changes.
Security and privacy impact: None; fixed local inference boundary preserved.
Data impact: Existing locally stored language preferences retained; no data migration.
Testing impact: Regression test prevents removed-element JavaScript errors.
Cost and schedule impact: Small focused UI change.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-008

```text
Change ID: AI-LAB-CC-008
Requested by: Repository maintainer
Date: 2026-10-11
Description: Add user-confirmed in-app installation of additional Ollama models.
Reason: Local Lab exposes installed models but has no direct installation UI.
Affected objective IDs: AI-LAB-OBJ-008
Architecture impact: New isolated local Ollama model-downloader adapter and small UI control.
Security and privacy impact: Ollama performs an external model-registry download only after owner confirmation; Lab remains loopback-only, no cloud inference or remote provider endpoints.
Data impact: Model files reside in Ollama-managed local storage, outside Git and SQLite.
Testing impact: Mocked pull/progress/errors/concurrency; routing, UI and release regression tests.
Cost and schedule impact: Model downloads may consume substantial local disk space and network bandwidth; no cloud GPU service provisioning.
Decision: APPROVED (SCOPE_INCREASE)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-013

```text
Change ID: AI-LAB-CC-013
Requested by: Repository maintainer
Date: 2026-10-12
Description: Standardize the public landing page and Local Lab runtime UI, prompts, and new agent responses on English after removal of language controls.
Reason: The user requested an English-only experience now that language selection is no longer offered.
Affected objective IDs: AI-LAB-OBJ-007
Architecture impact: Presentation, prompt-template, and new-message defaults only; fixed-loopback providers and settings controls remain unchanged.
Security and privacy impact: None; no endpoint, storage boundary, or external-service behavior changes.
Data impact: Existing SQLite records are preserved and are not machine-translated.
Testing impact: English-only source regression plus Local Lab, package, landing, and foundation checks.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-014

```text
Change ID: AI-LAB-CC-014
Requested by: Repository maintainer
Date: 2026-10-12
Description: Create or refresh a Desktop shortcut with an AI Agents Lab icon when the local Windows launcher runs.
Reason: Make the extracted local Lab easier to start after the user requests a shortcut and project-specific icon.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Adds a fixed local Windows shortcut script and packaged icon asset; the launcher remains the single local server entry point.
Security and privacy impact: The shortcut points only to the extracted local launcher; no network call, install, model download, driver change, or privilege elevation is performed.
Data impact: Creates or updates one current-user Desktop shortcut; no SQLite, model, or training data change.
Testing impact: Package regression verifies the shortcut script and icon are included.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-015

```text
Change ID: AI-LAB-CC-015
Requested by: Repository maintainer
Date: 2026-10-12
Description: State clearly that the extracted ZIP folder is the Local Lab location and explain when the Desktop shortcut is refreshed after an update.
Reason: The user requested clear guidance on where the Lab lives on the PC.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Public and packaged installation instructions only.
Security and privacy impact: None.
Data impact: None.
Testing impact: Landing-page regression asserts the explicit folder and shortcut guidance.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next public landing deployment and Local Lab release
```

## Approved change record — AI-LAB-CC-016

```text
Change ID: AI-LAB-CC-016
Requested by: Repository maintainer
Date: 2026-10-12
Description: Replace the Local Lab shortcut icon with a dark-azure project icon.
Reason: The user specified the Local Lab visual identity for the Windows shortcut.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Packaged icon asset only; no launch, server, or shortcut behavior change.
Security and privacy impact: None.
Data impact: None.
Testing impact: Existing package test verifies the icon remains packaged.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-017

```text
Change ID: AI-LAB-CC-017
Requested by: Repository maintainer
Date: 2026-10-12
Description: Set the default Training Lab flow to one Trainer and one Student.
Reason: The user requested a simpler default collaboration pair for now.
Affected objective IDs: AI-LAB-OBJ-007
Architecture impact: The training flow and visible participant summary are reduced from four automated turns to two; Conference Room remains unchanged.
Security and privacy impact: None.
Data impact: Existing SQLite records are preserved; new training sessions write two generated agent messages.
Testing impact: Server integration and flow regression expectations are updated.
Cost and schedule impact: Fewer inference turns reduce local runtime and model usage.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-018

```text
Change ID: AI-LAB-CC-018
Requested by: Repository maintainer
Date: 2026-10-12
Description: Remove the hero-area Open Local Lab button while retaining the contextual Open Local Lab link after the local-server startup instruction.
Reason: The user requested a single, correctly placed local link to avoid implying that the browser can launch the Lab.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Public landing-page presentation and regression assertion only.
Security and privacy impact: Reinforces the public-guide/local-runtime boundary.
Data impact: None.
Testing impact: Landing build test verifies one remaining contextual local link and no hero link.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next public landing deployment
```

## Approved change record — AI-LAB-CC-019

```text
Change ID: AI-LAB-CC-019
Requested by: Repository maintainer
Date: 2026-10-12
Description: Translate the complete packaged Local Lab README into English only.
Reason: The user requested English-only user documentation.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Documentation only; commands, local endpoints, and application behavior remain unchanged.
Security and privacy impact: Preserves and clarifies the existing local-only boundaries.
Data impact: None.
Testing impact: Package regression checks that the README has no Greek Unicode text and retains essential installation and privacy sections.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-020

```text
Change ID: AI-LAB-CC-020
Requested by: Repository maintainer
Date: 2026-10-12
Description: Add a direct Local Lab README link beside the Windows ZIP download on the public dashboard.
Reason: The user requested immediate access to the complete English setup documentation from the initial dashboard.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Public landing-page navigation only.
Security and privacy impact: Opens the official repository README in a new tab with noopener protection; no data collection or API is added.
Data impact: None.
Testing impact: Landing build test verifies the README link.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next public landing deployment
```

## Approved change record — AI-LAB-CC-021

```text
Change ID: AI-LAB-CC-021
Requested by: Repository maintainer
Date: 2026-10-12
Description: Serve the full Local Lab README from the public dashboard and open it in a new browser tab instead of GitHub.
Reason: The user requested documentation without leaving the dashboard for GitHub.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Landing build copies the canonical Local Lab README into its static artifact.
Security and privacy impact: Same-origin static documentation only; the link retains noopener protection.
Data impact: None.
Testing impact: Landing build test verifies the local README link and packaged README file.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next public landing deployment
```

## Approved change record — AI-LAB-CC-022

```text
Change ID: AI-LAB-CC-022
Requested by: Repository maintainer
Date: 2026-10-12
Description: Repair the public dashboard light mode with an explicit readable colour palette and synchronized theme-toggle label.
Reason: The existing light presentation had inadequate contrast and could show an incorrect mode label.
Affected objective IDs: AI-LAB-OBJ-003
Architecture impact: Client-side appearance styling and toggle state only.
Security and privacy impact: No new collection, storage, or network access; existing browser-local preferences remain unchanged.
Data impact: None.
Testing impact: Landing build regression asserts the light palette and mode-label synchronization code.
Cost and schedule impact: None.
Decision: APPROVED (DEFECT)
Approved by: Direct user request
Target release: Next public landing deployment
```

## Approved change record — AI-LAB-CC-032

```text
Change ID: AI-LAB-CC-032
Requested by: Repository maintainer
Date: 2026-10-12
Description: Remove LM Studio and vLLM choices and operate the Local Lab exclusively through fixed-loopback Ollama.
Reason: Standardise local inference on Ollama to provide one reliable contract for independent model selection, performance metrics, and future streaming progress.
Affected objective IDs: AI-LAB-OBJ-004, AI-LAB-OBJ-010
Architecture impact: The provider adapter contains only the native Ollama route; the browser has no inference-engine selector or provider-status route.
Security and privacy impact: Reduces the local inference attack surface to one fixed endpoint at 127.0.0.1:11434; no external endpoint, cloud API, or credential is introduced.
Data impact: Existing SQLite conversation records and session metadata are preserved. New sessions record Ollama as the fixed provider.
Testing impact: Replace multi-provider routing checks with Ollama-only discovery/routing and non-Ollama rejection coverage.
Cost and schedule impact: None.
Decision: APPROVED
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-031

```text
Change ID: AI-LAB-CC-031
Requested by: Repository maintainer
Date: 2026-10-12
Description: Display the configured model identifier beside each new Trainer and Student response in Learning Lab history.
Reason: Independent model selection must be visible in the conversation output, not only in the Lab controls.
Affected objective IDs: AI-LAB-OBJ-010
Architecture impact: The existing session metadata is returned with history rows and rendered by the presentation layer; inference routing is unchanged.
Security and privacy impact: None; model identifiers are local configuration metadata.
Data impact: Existing messages with no recorded assignment display no model label.
Testing impact: Extend routing regression to assert persisted history labels and add UI source coverage.
Cost and schedule impact: None.
Decision: APPROVED (DEFECT)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-030

```text
Change ID: AI-LAB-CC-030
Requested by: Repository maintainer
Date: 2026-10-12
Description: Add independent installed local-model selection for the Learning Lab Trainer and Student agents.
Reason: The user needs the two agents to execute their role-specific turns with different assigned local models when desired.
Affected objective IDs: AI-LAB-OBJ-010
Architecture impact: The existing fixed-loopback provider remains global; Training Lab requests snapshot separate role model IDs and store session metadata in SQLite without changing existing history.
Security and privacy impact: No provider URL, cloud API, credential, or external endpoint is added. Each configured model is validated against the selected local provider before inference.
Data impact: Adds backward-compatible SQLite session metadata and a nullable message session reference; existing messages remain readable.
Testing impact: Add UI persistence, independent routing, unavailable-model, and migration regression coverage.
Cost and schedule impact: None.
Decision: APPROVED
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-029

```text
Change ID: AI-LAB-CC-029
Requested by: Repository maintainer
Date: 2026-10-12
Description: Add Settings controls for background color and text font.
Reason: Let each local user personalise the Lab presentation without changing application data or behavior.
Affected objective IDs: AI-LAB-OBJ-007
Architecture impact: Local presentation preferences only.
Security and privacy impact: Preferences remain browser-local; no external service or telemetry is used.
Data impact: Stores selected background and font names in browser-local storage.
Testing impact: Verify controls, storage keys, default values, and CSS variants.
Cost and schedule impact: None.
Decision: APPROVED
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-028

```text
Change ID: AI-LAB-CC-028
Requested by: Repository maintainer
Date: 2026-10-12
Description: Apply zero-width values directly to the saved desktop panel-width properties when Hide is selected.
Reason: Inline saved widths overrode the CSS collapse rule, leaving empty side areas visible.
Affected objective IDs: AI-LAB-OBJ-007
Architecture impact: Local presentation interaction only; no data, provider, training, or network changes.
Security and privacy impact: None.
Data impact: Existing browser-local panel-width preferences are preserved and restored when Show is selected.
Testing impact: Add a regression assertion for explicit zero-width toggle behavior.
Cost and schedule impact: None.
Decision: APPROVED (DEFECT)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-027

```text
Change ID: AI-LAB-CC-027
Requested by: Repository maintainer
Date: 2026-10-12
Description: Change desktop Local Lab Hide controls from compact side rails to full side-column collapse with floating Show controls.
Reason: The user expects Hide to remove the entire column, not merely its text content.
Affected objective IDs: AI-LAB-OBJ-007
Architecture impact: Local presentation layout only; no data, provider, training, or network changes.
Security and privacy impact: None.
Data impact: Browser-local width preferences remain unchanged.
Testing impact: Add CSS regression assertions for zero-width collapsed columns and accessible floating Show controls.
Cost and schedule impact: None.
Decision: APPROVED (DEFECT)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-026

```text
Change ID: AI-LAB-CC-026
Requested by: Repository maintainer
Date: 2026-10-12
Description: Restore independent vertical scrolling for every desktop column in the Local Lab three-panel workspace.
Reason: The side navigation, conversation, and tools content could exceed the viewport without a usable internal scroll area.
Affected objective IDs: AI-LAB-OBJ-007
Architecture impact: Local presentation layout only; no provider, training, SQLite, or external service boundary changes.
Security and privacy impact: None.
Data impact: None.
Testing impact: Add regression assertions for explicit overflow and minimum-size constraints.
Cost and schedule impact: None.
Decision: APPROVED (DEFECT)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-025

```text
Change ID: AI-LAB-CC-025
Requested by: Repository maintainer
Date: 2026-10-12
Description: Explain empty advanced-training model and dataset dropdowns beside the affected fields, with disabled empty controls.
Reason: Prevent users from assuming that these dropdowns should contain preset choices before they add local compatible inputs.
Affected objective IDs: AI-LAB-OBJ-006
Architecture impact: Local training presentation only; model discovery, validation, and the isolated training boundary are unchanged.
Security and privacy impact: None.
Data impact: None.
Testing impact: Add regression assertions for guidance text and disabled empty selections.
Cost and schedule impact: None.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-024

```text
Change ID: AI-LAB-CC-024
Requested by: Repository maintainer
Date: 2026-10-12
Description: Reserve a fixed header area above the scrollable content of both Local Lab side panels.
Reason: The persistent Hide control overlapped the first visible tool when the panel content was scrolled.
Affected objective IDs: AI-LAB-OBJ-007
Architecture impact: Local presentation layout only; no model, provider, SQLite, or network boundary changes.
Security and privacy impact: None.
Data impact: None.
Testing impact: Add CSS regression assertions for the reserved panel header area.
Cost and schedule impact: None.
Decision: APPROVED (DEFECT)
Approved by: Direct user request
Target release: Next Local Lab release
```
