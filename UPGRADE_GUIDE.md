# AI Agents Lab Upgrade Guide

Use this guide when upgrading pinned foundation assets or either AI Agents Lab component. Do not overwrite project-owned scope, architecture, controls, configuration, evidence, local data, or approved exceptions.

## Sources

- `TEMPLATE_VERSION` records the inherited template baseline.
- `FOUNDATION_VERSIONS` identifies the upstream revisions assessed for the template release.
- `CHANGELOG.md` describes AI Agents Lab project changes.
- Foundation repositories remain authoritative for their own versions and normative content.

## Process

1. Create a dedicated upgrade branch and record the current project, component, template-baseline, and foundation revisions.
2. Review relevant project release notes and applicable upstream foundation changes.
3. Determine applicability per foundation: DNA workflow, `ENG-*` requirements, Shield controls, and Infrastructure patterns.
4. Apply the smallest compatible foundation or component changes. Keep normative catalogues and private Shield material upstream unless their owners explicitly authorize a safe distribution.
5. Update the project's adoption matrix, security plan, infrastructure profile, traceability, exceptions, and evidence.
6. Re-run the affected initialization, engineering, security, infrastructure, quality, and completion gates.
7. Update `TEMPLATE_VERSION`, component versions, and recorded foundation revisions only after verification passes.

An unknown earlier revision remains unknown; do not invent a version to simplify an upgrade.
