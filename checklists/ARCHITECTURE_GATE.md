# Architecture Gate

This DNA gate verifies the project's implementation of applicable [Ecosystem Engineering Standards](https://github.com/mmark76/Ecosystem-Engineering-Standards/blob/main/ENGINEERING-REQUIREMENTS.md), especially `ENG-ARCH-*`, `ENG-MAINT-*`, `ENG-API-*`, `ENG-DATA-*`, `ENG-DEP-*`, and `ENG-DEBT-*`. Its checklist items are verification prompts, not a separate source of normative requirements.

- [ ] Architecture supports all mandatory release requirements.
- [ ] System and trust boundaries are documented.
- [ ] Modules have clear responsibilities and ownership.
- [ ] Public interfaces are explicit.
- [ ] Dependency direction is defined.
- [ ] Circular dependencies are zero.
- [ ] Domain rules are separated from UI and infrastructure.
- [ ] Shared code is genuinely shared.
- [ ] Database changes use versioned migrations.
- [ ] External providers are isolated where justified.
- [ ] No blocking oversized or multi-responsibility units remain.
- [ ] No unapproved architecture exception remains.
- [ ] Architecture documentation and ADRs are current.
- [ ] No speculative architecture was added beyond the approved need.

**Result:** PASS / FAIL / NOT APPLICABLE
