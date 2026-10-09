# Completion and Stop Protocol

## 1. Purpose

Prevent both premature completion claims and endless improvement loops.

## 2. Completion Formula

```text
RELEASE_COMPLETE =
    SCOPE_FROZEN
    AND MANDATORY_OBJECTIVES_VERIFIED_100_PERCENT
    AND BLOCKING_ACCEPTANCE_CRITERIA_PASSED_100_PERCENT
    AND REQUIRED_GATES_PASSED
    AND OPEN_BLOCKERS_EQUAL_ZERO
    AND UNACCEPTED_CRITICAL_RISKS_EQUAL_ZERO
    AND UNAPPROVED_DEVIATIONS_EQUAL_ZERO
    AND REQUIRED_EVIDENCE_COMPLETE
```

## 3. Scope Freeze

The release scope must explicitly identify:

- mandatory items,
- blocking items,
- optional items,
- future items,
- rejected items,
- out-of-scope items.

New ideas do not enter the current release automatically.

## 4. Agent State Machine

```text
DISCOVER
→ PLAN
→ IMPLEMENT
→ VERIFY
→ COMPLETE
```

Alternative terminal states:

- `BLOCKED`
- `NEEDS_DECISION`
- `CHANGE_REQUEST`
- `RELEASE_COMPLETE`

## 5. Stop-on-Success Rules

Once an approved criterion passes:

- do not redesign it without a new reason,
- do not add optional enhancements,
- do not reopen it for theoretical improvement,
- do not start unrelated cleanup,
- do not create new work without an approved ID.

## 6. Anti-Loop Rules

- Maximum 3 repair attempts for the same failing check.
- Maximum 2 architecture rework cycles for the same task.
- Stop when progress requires a scope change or owner decision.
- Record non-blocking improvements in the future backlog.
- Never weaken a test merely to make it pass without proving the test was incorrect.

## 7. Final Declaration

Only after the final gate passes, issue:

> **RELEASE COMPLETE — 100% OF THE APPROVED IN-SCOPE OBJECTIVES VERIFIED**

Then stop modifying the repository.

## 8. Required Clarification

This declaration proves completion against the approved scope and criteria. It does not guarantee absolute perfection, permanent security, or absence of future maintenance.
