# Project Dashboard Guide

**Status:** Canonical standard

**Integrated template version:** 0.1.0

**Scope:** Future Markellos ecosystem dashboards and approved migrations

**Purpose:** A consistent, accessible, identifiable dashboard shell

## 1. Canonical Structure

Use the smallest useful page structure:

```text
Header → Main Content → Footer
```

The shell provides common identity and utilities. Project content, navigation,
accent, iconography, and Assistant details remain project-specific.

Existing repositories and deployed dashboards do not adopt a newer canonical
shell automatically. Each existing project requires a separate approved task,
impact review, verification, pull request, and deployment decision.

## 2. Canonical Header

The header has two logical sides.

### Left

```text
[Project logo/icon] [Project identity]
```

The identity includes a concise ecosystem/project label and the dominant
project name. Replace the reference `DT` mark with the approved project asset or
monogram during adoption.

### Right

The canonical logical order is mandatory:

```text
[Project Assistant] | GR | EN | Back to markellosecosystem | Light/Dark | Settings | Info
```

Visual wrapping or an accessible compact layout may adapt this sequence on
smaller screens, but the DOM/focus order and feature availability must remain.

### Project Assistant

Every adopted dashboard includes the shared Assistant component pattern:

- project-specific icon or avatar;
- project-specific Assistant name;
- visible status dot and status text;
- accessible button name and dialog relationship;
- a safe reference panel until an approved Assistant integration exists.

The template uses `Template Assistant` and `TA`. Adopting projects replace both
with their approved identity. The shell must not be coupled to one Assistant
provider or backend.

### Language

`GR` and `EN` are the canonical controls. Interface strings must be externalized
and layouts must tolerate Greek/English expansion without fixed-width labels.

The reference translates shell controls and explicitly states that its sample
content remains English. A project must supply complete project strings before
claiming full localization. Language choice is not written to appearance
storage.

### Ecosystem Return

The visible label is:

```text
Back to markellosecosystem
```

The target is always `https://markellosecosystem.com/` unless a separately
approved ecosystem destination replaces it.

### Light/Dark

Light/Dark is an immediate header action. It is separate from detailed Settings
and may share the same validated appearance preference record.

## 3. Settings

Settings opens an accessible modal dialog containing exactly these canonical
appearance capabilities:

- Accent colour
- Background colour
- Font
- Text size
- Spacing
- Reset appearance
- Close

The native modal must support keyboard operation, visible focus, Escape, focus
containment, and focus return to the invoking Settings control.

Preferences are local to the device and require no server. The canonical
storage record is namespaced and contains only validated appearance fields:

```text
colorMode, accent, background, font, textSize, spacing
```

Never store identity, authentication, analytics, Assistant conversation, or
sensitive data in that record. Storage failure must leave the UI usable.

## 4. Info

Info opens an accessible panel/dialog with this structure:

```text
Important Info
Feedback
────────────────
License
Privacy
Analytics choices
Copyright protected
────────────────
© [year] Markellos Markides. All rights reserved.
vX.Y.Z_YYYYMMDD_HHMM_SHA
```

Reference entries that do not yet have project destinations use native
disclosures with clear, non-broken placeholder explanations. They must not use
invented URLs.

Do not expose a visible GitHub link anywhere in the dashboard UI. Internal
repository references in engineering documentation remain allowed.

## 5. Canonical Footer

The footer always contains exactly two logical lines and no navigation:

```text
© [year] Markellos Markides. All rights reserved.
vX.Y.Z_YYYYMMDD_HHMM_SHA
```

License, Privacy, Analytics choices, Copyright protected, Documentation, and
other informational actions belong in Info when applicable.

## 6. Version and Build Identity

The production format is mandatory:

```text
vX.Y.Z_YYYYMMDD_HHMM_SHA
```

- `X.Y.Z`: semantic application/dashboard version;
- `YYYYMMDD`: build/release date in Cyprus local time;
- `HHMM`: build/release time in Cyprus local time;
- `SHA`: real seven-character lowercase Git commit SHA.

All build/release timestamp logic uses the IANA timezone:

```text
Europe/Nicosia
```

Do not use a fixed offset. The IANA timezone must apply EET (`UTC+2`) or EEST
(`UTC+3`) according to Cyprus daylight-saving rules.

The static reference has no build pipeline and therefore displays:

```text
v2.0.0_YYYYMMDD_HHMM_SHA
```

This explicit template ID preserves the production shape without inventing a
timestamp or SHA. Production adoption must inject all real metadata fields
before release. A populated value must match:

```regex
^v[0-9]+\.[0-9]+\.[0-9]+_[0-9]{8}_[0-9]{4}_[0-9a-f]{7}$
```

## 7. Main Content and Navigation

Keep primary navigation to real top-level destinations. Main content should
answer what the project is, what a user can do, current state, next action, and
open items. Prefer a few purposeful cards over decorative containers or dense
administration screens.

## 8. Responsive Contract

Verify at minimum:

- narrow/mobile below `30rem`;
- medium/tablet around `48rem`;
- desktop/wide at `80rem` or wider.

Controls may wrap, navigation may collapse, and cards may become a single
column. No canonical utility may disappear, page-level horizontal scrolling is
forbidden, and the logical order must remain stable.

## 9. Accessibility Contract

Target WCAG 2.2 AA where applicable:

- semantic landmarks and heading order;
- keyboard-operable controls and navigation;
- visible focus and logical focus order;
- correctly managed modal focus and Escape behavior;
- 44 × 44 CSS px minimum interactive targets;
- sufficient text, icon, and component contrast;
- 200% zoom/text-scaling resilience;
- Greek/English expansion resilience;
- reduced-motion support;
- no keyboard traps or color-only status.

## 10. Security and Privacy Contract

The reference shell uses HTML, CSS, vanilla JavaScript, and approved local
tokens only. It has no framework, package, backend, analytics, authentication,
third-party script, or remote font.

Treat local storage as untrusted input. Validate every persisted appearance
value before applying it, use safe DOM text APIs, and never place secrets or
personal data in client code or storage.

## 11. Adoption and Verification

During approved adoption:

1. replace the project identity and Assistant details;
2. select an approved theme and preserve shared tokens;
3. provide complete project-specific navigation and content;
4. provide real Info destinations where approved;
5. provide full Greek/English strings or declare the supported subset;
6. inject real build metadata using `Europe/Nicosia`;
7. run source tests, browser interaction tests, responsive checks,
   accessibility checks, security review, and visual QA;
8. record evidence and deviations;
9. deploy only through a separately approved project release.

The common identity comes from consistent contracts and behavior—not from
making every project visually identical.
