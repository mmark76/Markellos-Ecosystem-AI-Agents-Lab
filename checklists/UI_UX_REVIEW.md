# UI/UX Review Checklist

Use this checklist for any pull request that changes user-facing behavior or presentation.

## Identity and Theme

- [ ] Correct approved app theme is applied.
- [ ] Approved monogram/wordmark asset is used without distortion.
- [ ] Accent color is used selectively.
- [ ] No unapproved palette or typography values were introduced.

## Dashboard / Main Shell — when applicable

- [ ] `PROJECT_DASHBOARD_GUIDE.md` was followed.
- [ ] Header clearly identifies the project with a small project/ecosystem label and dominant project name.
- [ ] Header utilities follow the canonical order: Assistant, GR, EN, ecosystem return, Light/Dark, Settings, Info.
- [ ] The Assistant has a project-specific avatar, name, visible status, and accessible control contract.
- [ ] Primary navigation is simple and limited to real top-level destinations.
- [ ] Utility actions remain visually secondary to project navigation.
- [ ] `Back to markellosecosystem` or the approved ecosystem return path is present where applicable.
- [ ] Main content prioritizes a small number of clear, useful sections/cards rather than decorative complexity.
- [ ] Settings has every canonical appearance control, reset, accessible close/Escape behavior, and validated local persistence.
- [ ] Info has every canonical informational/legal entry, copyright, and build identity.
- [ ] Footer contains exactly the copyright line and build-ID line with no navigation.
- [ ] Populated builds use `vX.Y.Z_YYYYMMDD_HHMM_SHA`, a real Git SHA, and `Europe/Nicosia` time.
- [ ] No GitHub link is visibly exposed in the dashboard UI.
- [ ] Any deviation from the dashboard guide is documented and approved.

## Tokens and Components

- [ ] Semantic design tokens are used.
- [ ] Existing shared components were reused where appropriate.
- [ ] New shared components have documented states and accessibility contracts.
- [ ] No feature styles redefine ecosystem-wide values.

## Layout and Responsive Behavior

- [ ] Narrow, medium, and wide layouts were checked.
- [ ] Content remains readable at 200% browser zoom where applicable.
- [ ] Text scaling does not remove content or functionality.
- [ ] Touch and pointer targets meet the minimum size.
- [ ] Navigation behavior is appropriate for each platform.
- [ ] Header, main content, and Footer remain usable without horizontal scrolling on small screens.

## Interaction States

- [ ] Default, hover, focus, active, disabled, and loading states are defined where applicable.
- [ ] Loading, empty, zero-results, error, offline, and success states are handled where applicable.
- [ ] Destructive actions use clear warnings and proportional confirmation.
- [ ] Motion respects reduced-motion preferences.

## Accessibility

- [ ] Keyboard-only operation was checked.
- [ ] Focus order and visibility were checked.
- [ ] Text, icons, and essential boundaries meet contrast requirements.
- [ ] Controls have accessible names.
- [ ] Fields have labels and associated errors.
- [ ] Dynamic status changes are announced where needed.
- [ ] Color is not the only status cue.

## Content and Localization

- [ ] Greek and English content were checked where supported.
- [ ] Labels are explicit and use sentence case.
- [ ] Dates, numbers, units, and currencies are locale-aware.
- [ ] Text expansion does not break the layout.

## Evidence

- [ ] Screenshots or recordings cover materially changed states.
- [ ] Automated checks and manual checks are recorded.
- [ ] Known limitations are documented.
- [ ] Any deviation is recorded in `docs/governance/EXCEPTIONS.md`.
