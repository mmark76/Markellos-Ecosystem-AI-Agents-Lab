# Final Completion Gate

## Hard Conditions

- [ ] Release scope is frozen and approved.
- [ ] 100% of mandatory in-scope objectives are verified.
- [ ] 100% of blocking acceptance criteria pass.
- [ ] Requirements traceability is complete.
- [ ] Architecture gate passes.
- [ ] Engineering gate passes.
- [ ] Security gate passes.
- [ ] Infrastructure readiness passes where the selected profile requires it.
- [ ] UI/UX and accessibility requirements pass where applicable.
- [ ] Approved design tokens and app theme are implemented without unapproved deviations.
- [ ] Quality gate passes.
- [ ] Production readiness gate passes where applicable.
- [ ] Required data and privacy controls pass.
- [ ] Required documentation is complete.
- [ ] Required evidence, including material UI evidence, is present.
- [ ] Open blockers equal zero.
- [ ] Unaccepted critical risks equal zero.
- [ ] Unapproved deviations equal zero.
- [ ] Optional and future items are outside the current release.
- [ ] Human owner approval is recorded.

## Decision

- [ ] `RELEASE_COMPLETE`
- [ ] `CONDITIONAL_PASS` — may not be described as 100% complete
- [ ] `NOT_READY`

## Stop Instruction

When `RELEASE_COMPLETE` is selected, agents must stop modifying the repository until a new approved task or release scope is issued.
