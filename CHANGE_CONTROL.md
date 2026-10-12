# Change Control

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
Description: Create or refresh a Desktop shortcut with a University Lab icon when the local Windows launcher runs.
Reason: Make the extracted local Lab easier to start after the user requests a shortcut and university-style icon.
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
Description: Replace the University Lab shortcut icon with a dark-azure icon featuring two arches and a white graduation cap.
Reason: The user specified the University Lab visual identity for the Windows shortcut.
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
Architecture impact: The university flow and visible participant summary are reduced from four automated turns to two; Conference Room remains unchanged.
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
