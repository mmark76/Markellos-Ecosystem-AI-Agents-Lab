# Integrated Template Upgrade Guide

Use this guide when adopting a newer Integrated Project Template release into an existing project. Do not overwrite project-owned scope, architecture, controls, configuration, evidence, or approved exceptions.

## Sources

- `TEMPLATE_VERSION` is the adopted integrated-template version.
- `FOUNDATION_VERSIONS` identifies the upstream revisions assessed for the template release.
- `CHANGELOG.md` describes template release changes.
- Foundation repositories remain authoritative for their own versions and normative content.

## Process

1. Create a dedicated upgrade branch and record the project's current template and foundation revisions.
2. Review every relevant template changelog entry and the applicable upstream foundation changes.
3. Determine applicability per foundation: DNA workflow, `ENG-*` requirements, Shield controls, and Infrastructure patterns.
4. Apply the smallest compatible template changes. Keep normative catalogues and private Shield material upstream unless their owners explicitly authorize a safe distribution.
5. Update the project's adoption matrix, security plan, infrastructure profile, traceability, exceptions, and evidence.
6. Re-run the affected initialization, engineering, security, infrastructure, quality, and completion gates.
7. Update `TEMPLATE_VERSION` and the project’s recorded foundation revisions only after verification passes.

An unknown earlier revision remains unknown; do not invent a version to simplify an upgrade.
