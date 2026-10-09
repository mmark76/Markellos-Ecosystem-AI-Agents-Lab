# UI/UX Rules

## 1. Purpose

These rules make every application in the Markellos ecosystem feel like part of one coherent product family across web, mobile, tablet, and desktop.

The detailed specification is in `docs/design/UI_UX_DESIGN_SYSTEM.md`. Dashboard, landing-page, project-status, Header, Footer, and build-identity rules are in `PROJECT_DASHBOARD_GUIDE.md`. Platform-neutral design tokens are in `design-system/tokens/`.

## 2. Source of Truth

Use this precedence order:

1. Approved product and accessibility requirements.
2. `UI_UX_RULES.md`.
3. `docs/design/UI_UX_DESIGN_SYSTEM.md`.
4. `PROJECT_DASHBOARD_GUIDE.md` for dashboards, landing pages, project-status pages, and main web interfaces.
5. `design-system/tokens/tokens.json`.
6. Platform adapters generated from or mapped to those tokens.
7. Feature-level styles.

Feature code must not redefine ecosystem-wide design decisions.

The canonical dashboard shell in `PROJECT_DASHBOARD_GUIDE.md` is the default for
future adoption. Updating this template does not authorize changes to existing
repositories or deployments; each migration requires a separate approved task.

## 3. Ecosystem Identity

All apps share:

- the approved Markellos monogram and its geometry,
- the same typography system,
- the same spacing, radius, elevation, icon, and motion logic,
- the same component anatomy and interaction behavior,
- the same accessibility baseline,
- the same responsive layout principles,
- for applicable dashboards and main web interfaces, the same structural logic for project identity, Header, Footer, ecosystem return path, and visible version/build identification.

Each app may vary only through:

- app name and descriptor,
- one approved accent theme,
- a small set of domain icons or illustrations,
- domain-specific content and data visualizations.

The target balance is approximately 80% shared system and 20% app-specific expression.

## 4. Mandatory UI Invariants

- Use semantic design tokens; do not hard-code arbitrary colors, spacing, radii, shadows, or typography values.
- Use shared components before creating feature-specific variants.
- Keep business rules out of visual components.
- Preserve one visual hierarchy: page title, supporting text, primary action, content, secondary actions.
- Use accent color sparingly for identity, selection, emphasis, and primary actions.
- Use neutral surfaces for most content.
- Every interactive control has default, hover, focus, active, disabled, loading, and error behavior where applicable.
- Every data-driven view defines loading, empty, partial, error, offline, and success states.
- Destructive actions require clear wording and confirmation proportional to risk.
- Do not use color as the only carrier of meaning.
- Do not create dark patterns, deceptive urgency, hidden costs, or misleading controls.
- Dashboards, landing pages, project-status pages, and main web interfaces must follow `PROJECT_DASHBOARD_GUIDE.md` unless a documented project-specific requirement justifies an approved deviation.

## 5. Layout and Navigation

- Use a 4 px spacing grid.
- Keep primary content within the approved content-width tokens.
- General desktop applications may use a left navigation rail or sidebar plus a top app bar when task complexity warrants it.
- Simple project dashboards, landing pages, status pages, and ecosystem-facing home screens should default to the simpler **Header → Main Content → Footer** structure defined in `PROJECT_DASHBOARD_GUIDE.md`.
- Tablet layouts may collapse complex navigation into a compact rail or drawer.
- Mobile layouts use a compact top bar and either bottom navigation for 3–5 primary destinations or a drawer for larger information architectures.
- Preserve destination names and ordering across platforms.
- Cards are for grouped, actionable, or independently scannable content—not for every paragraph.
- Avoid deeply nested cards and excessive visual containers.
- For applicable project dashboards, keep primary navigation concise and preserve the ecosystem return link, project identity, stable Footer, copyright information, and visible version/build identity.

## 6. Theming

Set one approved app theme at the application root:

- `tech-toolbox`
- `mnemonics`
- `writing`
- `chess`
- `engineering`

The theme controls `app-accent`, `app-accent-strong`, `app-accent-soft`, `app-on-accent`, and `app-on-accent-strong`.

Always pair `on-accent` with `accent`, and `on-accent-strong` with `accent-strong`. Do not assume that one foreground color is accessible on both backgrounds.

Do not introduce a new theme without:

1. a documented product need,
2. contrast validation,
3. token additions,
4. design review,
5. approval through change control.

## 7. Typography and Content

- Use the shared sans-serif stack for interface text.
- Use monospace only for code, commands, technical values, or fixed-width data.
- Prefer sentence case.
- Keep labels short and explicit.
- Write buttons as actions: `Save`, `Create project`, `Export report`.
- Avoid vague labels such as `OK`, `Submit`, or `Click here` when a specific action is possible.
- Support Greek and English without clipping, truncation, or layout breakage.
- Do not encode meaning in text length assumptions.

## 8. Accessibility

The minimum target is WCAG 2.2 AA where applicable.

- All functionality must be keyboard accessible.
- Focus must be visible and must follow a logical order.
- Minimum pointer target is 44 × 44 CSS px or the platform equivalent.
- Text and essential icons must meet required contrast.
- Form fields require persistent labels, clear instructions, and programmatically associated errors.
- Announce dynamic status changes to assistive technologies.
- Respect text scaling, zoom, high contrast, and reduced-motion preferences.
- Provide alternatives for charts, diagrams, audio, and non-text content.
- Accessibility failures are product defects, not optional polish.

## 9. Responsive and Cross-Platform Behavior

- Design from content and task priority, not from a single reference screen.
- Define behavior at narrow, medium, and wide widths.
- Do not merely shrink desktop layouts.
- Preserve platform conventions for navigation, menus, dialogs, back behavior, system bars, and input methods.
- Keep ecosystem identity in tokens and component behavior, while allowing platform-native control details when they improve usability.
- Test touch, mouse, keyboard, screen reader, and high-density display behavior as applicable.

## 10. Component Creation Rule

Create a new shared component only when:

- the pattern appears in at least two independent features or apps,
- its responsibility is stable,
- its states and accessibility contract are defined,
- it can be documented and tested independently.

A feature-specific component remains inside its feature until reuse is proven.

## 11. Verification

For UI-impacting work, record:

- affected requirement IDs,
- theme used,
- components and tokens used,
- dashboard-guide compliance where applicable,
- responsive widths tested,
- keyboard and focus verification,
- contrast and accessibility results,
- screenshots or recordings for materially changed states,
- known limitations and approved exceptions.

For dashboard or main-shell changes, verification must also confirm Header structure, project identity, navigation simplicity, Footer content, ecosystem return path where applicable, and version/build identification.

## 12. Exception Rule

Any deviation from this system or from `PROJECT_DASHBOARD_GUIDE.md` must be explicit, justified, time-bounded where temporary, assigned to an owner, and recorded in `docs/governance/EXCEPTIONS.md`.

Silent UI/UX or dashboard-identity deviations are forbidden.
