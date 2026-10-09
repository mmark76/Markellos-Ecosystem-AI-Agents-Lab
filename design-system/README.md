# Markellos Design System

This directory contains the implementation-facing source of truth for the shared UI language used by all Markellos ecosystem apps.

## Structure

```text
design-system/
├── README.md
├── brand/
│   └── README.md
└── tokens/
    ├── tokens.json
    └── tokens.css
```

## Usage

1. Select one approved app theme at the application root.
2. Import or map the core tokens.
3. Build shared primitives and components from semantic tokens.
4. Keep feature-specific styles inside their feature.
5. Validate contrast, focus, responsive behavior, localization, and all required UI states.

Web example:

```html
<html data-theme="mnemonics">
```

```css
@import "./design-system/tokens/tokens.css";

.primary-action {
  min-height: var(--touch-target-min);
  padding-inline: var(--space-4);
  color: var(--app-on-accent-strong);
  background: var(--app-accent-strong);
  border-radius: var(--radius-md);
}

.accent-label {
  color: var(--app-on-accent);
  background: var(--app-accent);
}
```

Use the matching foreground token for its background: `on-accent` with `accent`, and `on-accent-strong` with `accent-strong`.

## Platform Mapping

- **Web:** consume `tokens.css` directly or generate framework variables.
- **React Native:** map JSON values to a typed theme object.
- **Flutter:** generate `ThemeData`, `ColorScheme`, spacing, radius, and text-style constants.
- **Android:** generate Compose theme values or XML resources.
- **Apple platforms:** generate Swift constants and map them to `Color`, typography, spacing, and shape definitions.
- **Desktop frameworks:** map the same semantic roles to the platform theme layer.

Generated adapters must preserve token names and meaning. They must not become independent sources of truth.

The maintained web adapter exposes the typography source keys as
`--font-weight-*` and `--line-height-*` variables. Component styles must use
those variables rather than repeating numeric font weights or line heights.
It also exposes the existing platform-neutral neutral palette as
`--color-neutral-*` variables so approved light/dark role mappings do not copy
raw color values into component styles.

## Governance

- Changes to shared tokens require design review and contrast validation.
- Breaking token changes require a major version.
- New app themes require approval through `CHANGE_CONTROL.md`.
- Deprecated tokens remain documented for at least one migration cycle.
- Applications must not fork the core token set without an approved exception.

See `UI_UX_RULES.md` and `docs/design/UI_UX_DESIGN_SYSTEM.md`.
