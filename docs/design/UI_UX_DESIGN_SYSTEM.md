# Markellos Ecosystem UI/UX Design System

**Version:** 1.2.0
**Status:** Baseline standard for all new and existing apps  
**Applies to:** Web, mobile, tablet, desktop, installable web apps, and hybrid applications

The canonical dashboard shell is the default for new work. Existing apps remain
subject to this design baseline, but shell migration is never automatic and
requires separate project approval, regression verification, and release scope.

## 1. Objective

Create one recognizable, calm, practical, and accessible experience across the full Markellos app ecosystem.

The system is based on the representative visual examples supplied for:

- Tech Toolbox,
- Mnemonics Studio,
- Personal Thoughts & Writings,
- Chess Reflections,
- engineering and construction tools.

The examples share a consistent monogram, blue and blue-grey foundations, app-specific accent colors, restrained layouts, clear cards, strong headings, and functional navigation. This document turns those characteristics into reusable rules rather than isolated page styles.

## 2. Design Principles

### 2.1 One ecosystem, distinct apps

Every app must be recognizable as part of the same family. Domain identity comes from an approved accent, app name, iconography, and content—not from rebuilding the whole interface.

### 2.2 Function before decoration

Visual decisions must improve comprehension, task completion, trust, or recall. Decorative elements must not compete with content.

### 2.3 Calm density

Interfaces should feel efficient without appearing crowded. Use whitespace, grouping, alignment, and hierarchy before adding borders, panels, or color.

### 2.4 Consistency with purpose

Equivalent actions look and behave equivalently across apps. Differences are allowed only when the platform or task genuinely requires them.

### 2.5 Accessible by default

Accessibility is built into tokens, components, content, states, and validation. It is not a final-stage overlay.

### 2.6 Progressive disclosure

Show essential information and actions first. Advanced controls, long explanations, and rare options appear on demand.

## 3. Brand Architecture

### 3.1 Shared ecosystem core

The following remain consistent:

- monogram geometry,
- typography family and scale,
- spacing grid,
- shape language,
- elevation logic,
- icon style,
- component anatomy,
- interaction states,
- accessibility behavior,
- responsive behavior.

### 3.2 App theme layer

Each app selects one theme:

| Theme | Intended use | Accent | Supporting character |
|---|---|---:|---|
| `tech-toolbox` | Utilities, calculators, technical tools | `#6F8499` | precise, neutral, technical |
| `mnemonics` | Learning and memory systems | `#2B7A78` | structured, calm, cognitive |
| `writing` | Personal thoughts, notes, long-form writing | `#6E688A` | reflective, editorial, quiet |
| `chess` | Chess study, history, tactics, training | `#D9AE20` | classical, analytical, distinctive |
| `engineering` | Civil engineering, construction, safety | `#F2C230` with steel blue `#2F638C` | industrial, visible, trustworthy |

Accent colors should occupy a small proportion of the interface. Neutral surfaces and shared brand blues provide continuity.

### 3.3 Logo and app lockup

Preferred lockup:

```text
[monogram]  App name
             Short descriptor, when needed
```

Rules:

- keep one monogram geometry across apps,
- do not place domain symbols inside the monogram,
- use app color as a treatment, not as a redesign,
- keep the app name legible at small sizes,
- use the monogram alone only when the app context is already clear,
- use approved SVG assets for production.

## 4. Color System

### 4.1 Core colors

| Role | Token | Value |
|---|---|---:|
| Deep brand | `color.brand.900` | `#153B6B` |
| Primary brand | `color.brand.700` | `#245C8D` |
| Secondary brand | `color.brand.500` | `#4F82A8` |
| Brand tint | `color.brand.100` | `#EAF2F8` |
| Background | `color.role.background` | `#F8FAFC` |
| Surface | `color.role.surface` | `#FFFFFF` |
| Primary text | `color.role.text` | `#1F2937` |
| Muted text | `color.role.text-muted` | `#5B6675` |
| Border | `color.role.border` | `#E5E7EB` |

### 4.2 Semantic colors

Use semantic colors only for status:

- success: `#2E7D32`,
- warning: `#A15C00`,
- error: `#B42318`,
- information: `#2563EB`,
- focus: `#0B6EBD`.

Do not substitute an app accent for error, warning, or success meaning.

### 4.3 Contrast rules

- Normal text must meet at least 4.5:1 contrast.
- Large text must meet at least 3:1.
- Essential component boundaries and graphical objects must meet at least 3:1 where required.
- Yellow themes use dark text, not white.
- Muted text must remain readable; “muted” does not mean low contrast.
- Disabled states must remain understandable and must not rely on opacity alone.

## 5. Typography

Use a platform-resilient sans-serif stack:

```text
Inter, Noto Sans, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
```

Use `Noto Sans` or another approved font with strong Greek support where the primary font is unavailable.

### 5.1 Type scale

| Role | Size | Weight token | Line-height token |
|---|---:|---|---|
| Display | 36 px | `font.weight.bold` (700) | `font.line-height.tight` (1.2) |
| Page title | 30 px | `font.weight.bold` (700) | `font.line-height.tight` (1.2) |
| Section title | 24 px | `font.weight.semibold` or `font.weight.bold` (600–700) | `font.line-height.tight` (1.2) |
| Card title | 18–20 px | `font.weight.semibold` (600) | `font.line-height.compact` (1.3) |
| Body | 16 px | `font.weight.regular` (400) | `font.line-height.normal` (1.5) |
| Supporting text | 14 px | `font.weight.regular` (400) | `font.line-height.normal` (1.5) |
| Label/caption | 12–14 px | `font.weight.medium` or `font.weight.semibold` (500–600) | `font.line-height.snug` (1.4) |

Rules:

- use no more than three prominent type sizes on one screen,
- use weight and spacing before introducing a new size,
- prefer sentence case,
- avoid all-caps paragraphs,
- keep long reading content near 60–75 characters per line,
- allow text scaling without loss of content or function.

## 6. Spacing, Shape, and Elevation

### 6.1 Spacing

Use a 4 px base grid. Preferred steps:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80 px
```

Common application:

- icon-to-label: 8 px,
- related controls: 8–12 px,
- form field stack: 16 px,
- card padding: 16–24 px,
- section separation: 32–48 px,
- page gutters: 16 px mobile, 24–32 px tablet, 32–48 px desktop.

### 6.2 Radius

- small controls and tags: 6 px,
- inputs and buttons: 10 px,
- cards and panels: 14 px,
- prominent containers: 20 px only when justified,
- pills: fully rounded.

Do not mix unrelated radius values within one screen.

### 6.3 Elevation

Prefer borders and surface contrast over shadows.

- `shadow-sm`: floating control or subtle card separation,
- `shadow-md`: menus, popovers, temporary overlays,
- `shadow-lg`: dialogs and high-priority overlays.

Do not use heavy shadows on ordinary content cards.

## 7. Iconography and Imagery

- Use one coherent outline icon family.
- Default icon stroke should feel consistent across sizes.
- Use filled icons only for selected states or high-salience status.
- Icons supporting text are normally 16–20 px.
- Standalone touch icons are normally 20–24 px inside a 44 px minimum target.
- Every unfamiliar icon requires a label or accessible name.
- Avoid mixing emoji with interface icons.
- Domain illustrations may vary by app but must use restrained geometry and the app palette.
- Images must include useful alternatives where required.

## 8. Layout System

### 8.1 Content widths

- narrow reading/form content: up to 42 rem,
- standard application content: up to 72 rem,
- wide dashboards and data tables: up to 90 rem.

Center content when extra width does not improve the task.

### 8.2 Responsive ranges

Use content-driven breakpoints, with these shared references:

| Range | Reference |
|---|---:|
| Small | below 480 px |
| Medium | 480–767 px |
| Large | 768–1023 px |
| Extra large | 1024–1279 px |
| Wide | 1280 px and above |

### 8.3 Desktop shell

Recommended structure:

```text
Top app bar
├── ecosystem/app identity
├── context or breadcrumbs
└── global actions

Left navigation
├── primary destinations
├── current selection
└── secondary/system destinations

Main content
├── page header
├── primary action
├── content sections
└── contextual actions
```

The sidebar may be 72 px compact or approximately 240 px expanded.

### 8.4 Mobile shell

- use a compact app bar,
- keep one clear page title,
- use bottom navigation only for 3–5 high-frequency destinations,
- place overflow destinations in a drawer or more menu,
- keep primary actions reachable,
- avoid desktop sidebars compressed into narrow screens.

## 9. Navigation

- Use task-oriented, stable labels.
- Keep primary navigation to approximately 5–7 top-level items.
- Highlight the current destination with more than color alone.
- Preserve user context when moving between related screens.
- Breadcrumbs are appropriate for deep hierarchical tools, not for simple apps.
- Back behavior must follow platform expectations.
- Opening a new window or external app must be communicated when unexpected.

## 10. Core Components

### 10.1 Buttons

Variants:

- primary: one dominant action per region,
- secondary: alternative or supporting action,
- tertiary/text: low-emphasis action,
- destructive: irreversible or high-risk action,
- icon button: only with a clear accessible name.

Rules:

- minimum height 40 px; interactive target at least 44 px,
- label describes the action,
- loading state preserves width and communicates progress,
- disabled state is used only when the reason is understandable,
- dangerous actions are not styled as ordinary primary actions.

### 10.2 Inputs

- persistent visible label,
- optional helper text,
- clear required/optional indication,
- validation close to the field,
- errors describe the problem and recovery,
- input type and keyboard match expected data,
- do not use placeholder text as the only label.

### 10.3 Cards

Use cards for:

- grouped tools,
- dashboard summaries,
- individually actionable records,
- short, scannable content units.

Avoid cards for:

- every text section,
- nested containers,
- simple page layout that can use headings and spacing.

### 10.4 Tables and data grids

- align text left and comparable numeric values consistently,
- make headers persistent where long scrolling requires it,
- provide sorting and filtering only when useful,
- preserve row identity on small screens,
- use responsive alternatives rather than unreadably narrow columns,
- provide accessible names and status for sorting,
- show empty, loading, and error states.

### 10.5 Dialogs

- use only for focused decisions or short tasks,
- use a clear title and outcome-oriented actions,
- trap focus correctly,
- return focus to the invoking control,
- avoid stacking dialogs,
- prefer a full page or sheet for complex multi-step work.

### 10.6 Notifications

- inline message for local issues,
- banner for page-level or persistent status,
- toast for brief confirmation that does not require action,
- dialog only when immediate acknowledgement is essential.

Toasts must not contain the only copy of critical information.

### 10.7 Tags and badges

Use for concise categories, states, or counts. They are not buttons unless visibly and semantically interactive.

## 11. Required Screen States

Every data-dependent feature must specify:

- initial/loading,
- skeleton or progress state,
- empty state,
- zero-results state after filtering,
- partial-data state,
- offline state when relevant,
- permission-denied state,
- recoverable error,
- unrecoverable error,
- success/confirmation,
- stale-data state when relevant.

An empty state should explain what the area is, why it is empty, and the next useful action.

## 12. Interaction and Motion

- standard transitions: approximately 120–200 ms,
- larger structural transitions: up to approximately 320 ms,
- motion should explain change, hierarchy, or continuity,
- never delay a task merely for animation,
- avoid continuous or distracting motion,
- respect reduced-motion settings,
- do not rely on gesture-only interactions without an alternative.

## 13. Forms and Workflows

- group fields by user goal,
- order fields logically,
- minimize mandatory input,
- preserve entered data after recoverable errors,
- show progress for multi-step workflows,
- review high-impact submissions before final confirmation,
- identify autosave clearly,
- distinguish `Save draft`, `Save`, `Submit`, and `Publish`,
- warn before abandoning unsaved work when loss is likely.

## 14. Content and Localization

The ecosystem supports Greek and English.

- externalize all interface strings,
- allow text expansion of at least 30%,
- avoid fixed-width labels,
- use locale-aware dates, numbers, currencies, and units,
- do not concatenate translated fragments,
- keep terminology consistent across apps,
- use plain language,
- provide concise explanations for technical or safety-related terms.

Engineering and safety apps must prioritize unambiguous wording over brevity.

## 15. Accessibility Standard

Target WCAG 2.2 AA where applicable and follow native platform accessibility guidance.

Required:

- semantic landmarks and headings,
- logical reading and focus order,
- visible focus,
- keyboard operation,
- accessible names and descriptions,
- form labels and error association,
- minimum touch targets,
- sufficient contrast,
- text zoom and scaling,
- reduced motion,
- non-color status cues,
- alternatives for non-text content,
- screen-reader announcements for important dynamic updates,
- no keyboard traps except correctly managed modal contexts.

## 16. Platform Adaptation

### Web and PWA

Use semantic HTML first. Ensure responsive layout, browser zoom, keyboard behavior, focus management, and offline messaging where applicable.

### iOS and macOS

Use native navigation and control expectations. Support Dynamic Type, VoiceOver, reduced motion, and sufficient pointer/touch targets.

### Android

Use platform navigation expectations, back behavior, TalkBack, font scaling, and Compose or native semantic roles.

### Windows and desktop frameworks

Support keyboard-first workflows, visible focus, window resizing, high contrast, scalable text, and predictable menus and shortcuts.

### Cross-platform frameworks

Do not force identical pixels across platforms. Share tokens, component contracts, and identity while respecting platform interaction conventions.

## 17. Design-to-Development Handoff

Each UI feature should define:

- requirement and acceptance-criteria IDs,
- user goal,
- information hierarchy,
- app theme,
- component inventory,
- states,
- responsive behavior,
- keyboard and assistive-technology behavior,
- content and localization notes,
- analytics or event requirements where approved,
- screenshots or prototypes for material changes.

Implementation must use semantic tokens rather than copying visual values from screenshots.

## 18. Quality Assurance

For material UI changes, verify:

- narrow, medium, and wide layouts,
- portrait and landscape where relevant,
- keyboard-only completion,
- screen-reader basics,
- focus visibility and order,
- contrast,
- text scaling and zoom,
- reduced motion,
- loading, empty, error, and success states,
- Greek and English content,
- touch and pointer targets,
- high-density displays,
- supported browsers and operating systems.

Automated accessibility checks support but do not replace manual verification.

## 19. Governance and Versioning

- `tokens.json` is the platform-neutral source of truth.
- `tokens.css` is the maintained web adapter.
- Shared component changes require review across affected apps.
- New themes require contrast testing and change-control approval.
- Breaking changes increment the major version.
- Additive compatible changes increment the minor version.
- Fixes that preserve contracts increment the patch version.
- Record temporary deviations in `docs/governance/EXCEPTIONS.md`.
- Review the system periodically using evidence from real apps, not fashion trends alone.

## 20. Adoption Sequence

For an existing app:

1. inventory current colors, typography, spacing, components, and states,
2. map current values to semantic tokens,
3. select the correct app theme,
4. replace repeated primitives first,
5. standardize navigation and page shells,
6. migrate high-frequency components,
7. repair accessibility gaps,
8. validate responsive and localized layouts,
9. remove obsolete local values,
10. record approved exceptions and remaining migration work.

## 21. Release Gate

A UI feature is not complete until:

- it follows `UI_UX_RULES.md`,
- it uses approved tokens and theme,
- all required states exist,
- accessibility criteria pass,
- responsive behavior is verified,
- content works in supported languages,
- evidence is recorded,
- deviations are approved and documented.

The goal is not identical screens. The goal is one coherent design language, predictable behavior, and domain-appropriate expression across every Markellos app.
