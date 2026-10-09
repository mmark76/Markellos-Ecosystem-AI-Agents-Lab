# Integrated Template Reference Site

This repository contains a dependency-free, project-safe reference shell for
future Markellos Ecosystem dashboards. It is not the canonical Framework site.

## Hosting boundary

This template has no canonical hostname or production deployment. Projects
created from it choose their own approved deployment arrangement. The upstream
Framework dashboard and the Foundation Systems umbrella are separate systems.

The reusable repository template intentionally does **not** contain a root
`CNAME` file. Domain binding for `template.markellosecosystem.com` belongs to
the separately approved Cloudflare deployment configuration, so repositories
created from this template do not inherit the canonical template site's domain.

## Source Files

- `index.html` — semantic shell, dialogs, reference content, and build metadata.
- `dashboard.css` — responsive layout, appearance modes, dialog styling, and
  accessible interaction states.
- `dashboard.js` — language shell, local appearance preferences, modal behavior,
  mobile navigation, copyright year, and build-ID formatting.
- `design-system/tokens/tokens.css` — approved ecosystem token adapter.
- `tests/dashboard-shell.test.cjs` — dependency-free contract and unit tests.
- `PROJECT_DASHBOARD_GUIDE.md` — canonical adoption standard.

## Canonical Contracts

Header:

```text
LEFT:  [Project identity]
RIGHT: [Project Assistant] | GR | EN | Back to markellosecosystem | Light/Dark | Settings | Info
```

Footer:

```text
© [year] Markellos Markides. All rights reserved.
vX.Y.Z_YYYYMMDD_HHMM_SHA
```

Settings provides Accent colour, Background colour, Font, Text size, Spacing,
Reset appearance, and Close. The single local-storage record contains validated
appearance preferences only.

Info contains Important Info, Feedback, License, Privacy, Analytics choices,
Copyright protected, the copyright line, and the build ID. Reference actions
explain where project-specific behavior belongs instead of linking to invented
destinations.

The dashboard UI must not visibly expose GitHub. Engineering documentation may
continue to reference repositories internally.

## Localization

The reference provides GR/EN architecture and translates canonical shell
controls. Sample project content remains English, and the UI says so. Adopting
projects must externalize and provide all project strings before claiming full
Greek/English localization.

## Appearance Persistence

The key `markellos.dashboard.appearance.v1` stores only:

```text
colorMode, accent, background, font, textSize, spacing
```

Values are allow-listed or validated before use. Storage is optional: when it
is blocked or unavailable, the controls remain functional for the current page.

## Build Metadata Injection

The reference metadata is intentionally incomplete:

```html
<meta name="build-version" content="0.2.0">
<meta name="build-date" content="">
<meta name="build-time" content="">
<meta name="build-time-zone" content="Europe/Nicosia">
<meta name="build-commit" content="">
```

This displays the non-fabricated fallback:

```text
v0.2.0_YYYYMMDD_HHMM_SHA
```

An approved build/release process must inject:

- the real semantic project version;
- `YYYYMMDD` and `HHMM` produced with an IANA-timezone API configured to
  `Europe/Nicosia`;
- the real Git commit, from which the formatter uses seven lowercase hex
  characters.

Do not use a fixed UTC offset and do not type a guessed SHA. A populated build
ID must match:

```regex
^v[0-9]+\.[0-9]+\.[0-9]+_[0-9]{8}_[0-9]{4}_[0-9a-f]{7}$
```

`dashboard.js` exports dependency-free formatting helpers for approved build
tooling and tests. Its timezone test covers both EET and EEST behavior.

## Verification

Run:

```powershell
node --check dashboard.js
node --test tests/dashboard-shell.test.cjs
```

Also verify the page in a real browser at narrow, medium, and wide sizes,
including Assistant, GR/EN, ecosystem return, Light/Dark, Settings persistence
and reset, Info, mobile navigation, modal focus/Escape behavior, 200% zoom,
console errors, horizontal overflow, and visual hierarchy.

## Adoption Boundary

This is a future-adoption standard. Do not propagate it to an existing
repository or deployment without a separate approved task. Copying template
files does not authorize a production deployment, DNS change, or release.
