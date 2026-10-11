# Change Control

## Rule

After scope freeze, every proposed change must be classified.

## Change Classes

- `DEFECT`: approved behavior is not working.
- `CLARIFICATION`: no material scope change.
- `SCOPE_SWAP`: new item replaces another approved item.
- `SCOPE_INCREASE`: adds time, cost, risk, or deliverables.
- `FUTURE`: deferred to a later release.
- `REJECTED`: not approved.

## Required Change Record

```text
Change ID:
Requested by:
Date:
Description:
Reason:
Affected objective IDs:
Architecture impact:
Security and privacy impact:
Data impact:
Testing impact:
Cost and schedule impact:
Decision:
Approved by:
Target release:
```

AI agents must not approve their own material scope increases.

## Approved change record — AI-LAB-CC-006

```text
Change ID: AI-LAB-CC-006
Requested by: Repository maintainer
Date: 2026-10-11
Description: Optional isolated local PyTorch LoRA/SFT training workspace with CUDA detection.
Reason: Extend the Local Lab from inference to controlled local model improvement.
Affected objective IDs: AI-LAB-OBJ-006
Architecture impact: New training boundary; inference and SQLite remain unchanged.
Security and privacy impact: Local enumerated paths only; no remote downloads or cloud resources.
Data impact: JSONL datasets and adapters remain untracked outside SQLite.
Testing impact: Add deterministic training, CUDA, packaging, and inference-regression checks.
Cost and schedule impact: User-controlled local compute only; no billable resource.
Decision: APPROVED
Approved by: Direct user request
Target release: Next Local Lab release
```

## Approved change record — AI-LAB-CC-007

```text
Change ID: AI-LAB-CC-007
Requested by: Repository maintainer
Date: 2026-10-11
Description: Hide Interface and Agent responses language selectors in private Local Lab.
Reason: Simplify the UI at the user's request.
Affected objective IDs: AI-LAB-OBJ-007
Architecture impact: Presentation and its JavaScript consumers only; no backend changes.
Security and privacy impact: None; fixed local inference boundary preserved.
Data impact: Existing locally stored language preferences retained; no data migration.
Testing impact: Regression test prevents removed-element JavaScript errors.
Cost and schedule impact: Small focused UI change.
Decision: APPROVED (CLARIFICATION)
Approved by: Direct user request
Target release: Next Local Lab release
```
