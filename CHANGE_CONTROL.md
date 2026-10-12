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
