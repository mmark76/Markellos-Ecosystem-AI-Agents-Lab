# Changelog

All notable AI Agents Lab changes are recorded here. `TEMPLATE_VERSION` records the inherited baseline; `FOUNDATION_VERSIONS` records the upstream revisions assessed for this project. Project, foundation, landing-page, and Local Lab versions remain independently owned.

## [Unreleased]

### Changed

- Fixed Windows training setup Python detection so the wizard executes the Python launcher rather than its displayed version.
- Explained how to install the optional local model-training environment when it is missing.
- Made Conference Room roles general-purpose: Planner, Researcher, and Reviewer.
- Collapsed optional model training behind an Advanced control with a plain-language setup notice.
- Removed the Local Lab update-check control; the public dashboard is the single place to download a newer ZIP.
- Made White the default Local Lab accent and kept all six desktop accent choices on one row.
- Added a confirmed **Clear conversation / Start new session** control that removes only the selected room's local SQLite history after the active agent session finishes.
- Replaced residual template documentation with AI Agents Lab project identity, architecture, data, operations, testing, security, risk, and engineering-adoption records.
- Added Local Lab 0.1.2 safe manual update discovery: fixed official release metadata, validated links, and no automatic download or installation.
- Clarified that the public `Open Local Lab` link works only after the user starts `start-windows.bat` from the extracted Windows ZIP.
- Added an explicit public notice that ZIP upgrades are manual and local models plus SQLite history must be preserved.
- Changed the public landing page default to the Local Lab's black appearance while retaining user-selectable accent and background colours.
- Standardized the public landing page and Local Lab runtime UI, prompts, and new agent responses on English after removal of language controls.
- Added a University Lab desktop shortcut with a packaged local icon, created when the Windows launcher first runs.
- Clarified that the extracted ZIP folder is the Lab location and that an update refreshes the Desktop shortcut only after the new launcher runs.
- Replaced the University Lab shortcut icon with a dark-azure design featuring two arches and a white graduation cap.
- Simplified the default Training Lab flow to one Trainer and one Student.
- Removed the hero-area Open Local Lab button while retaining the contextual local link in the startup instructions.
- Translated the packaged Local Lab README into English only.
- Added a direct README link beside the Windows ZIP download on the public dashboard; it opens the packaged README in a new browser tab rather than GitHub.
- Repaired the landing dashboard light mode with a complete high-contrast palette and a synchronized theme-toggle label.

## [0.2.0] - 2026-10-08

### Added

- Pinned, sanitized Engineering Standards, Shield, and Infrastructure snapshots from the reviewed DNA revision.
- Strong Room templates, verification utilities, schemas, capability model, and safety validation for project-safe adoption.

### Changed

- Updated the DNA pin to `c6f12b715f3fd8ed84446ded77144e1334ddb752`.

## [0.1.0] - 2026-10-07

### Added

- Integrated foundation provenance manifest and explicit non-competing authority model.
- `ENG-*` applicability, exception, verification, and evidence adoption records.
- Shield adoption boundary that avoids copying private or operational security material.
- Explicit infrastructure profile and readiness mechanism supporting `NOT_APPLICABLE`, `LOCAL_ONLY`, `SHARED_INFRASTRUCTURE`, and `DEPLOYED_SERVICE`.
- Integrated initialization, engineering, security, infrastructure, and completion gates.

### Changed

- Reframed the repository from a copy of Ecosystem Framework — The DNA into a consumable Integrated Project Template.
