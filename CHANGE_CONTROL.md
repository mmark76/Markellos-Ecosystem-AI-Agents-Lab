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
