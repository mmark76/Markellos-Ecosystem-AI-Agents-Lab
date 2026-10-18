# Automatic Exercise Selection — Controlled Local Implementation

**Decision (2026-10-18):** Remove the user's need to find, choose, copy or paste practice exercises, while retaining the existing 5 Labs, 15 agent identities and their role-specific system prompts. This implementation is **automatic task selection when a Training Lab session starts**, not a scheduled or autonomous inference service.

## Actual behavior

1. User selects **Training Lab** and installed local Ollama models using the existing controls (or their saved browser selections).
2. Only the Training Lab topic field is optional. With a custom topic, the existing `POST /api/run` workflow is unchanged. The other four Labs require a user-supplied topic.
3. When the topic is empty and **Start** is pressed, the UI sends `POST /api/auto-run` with the existing room, provider and model assignments, but no prompt.
4. The server validates the same fixed local provider, model assignments, request origin and single-session lock.
5. It chooses a task using deterministic Training-only rotation, counting only prior Training user messages with a server-assigned, non-null SQLite `exercise_id`. Manual topic text, even if it starts with `[AUTO EXERCISE:`, cannot advance the rotation.
6. The selected original text-only exercise is persisted as the user's task in local SQLite history, with an explicit `exercise_id` field and its methodology reference URL in the recorded task. The existing Tutor → Student → Evaluator → Improver prompts and stage storage are unchanged.
7. Every subsequent automatically started Training Lab session chooses the next local example. There are **two starter exercises, both for Training Lab**.

The existing Training Lab remains Tutor → Student → Evaluator → Improver. Evaluation Lab, Advisory Lab, Conference Room and Optimization Lab retain their own workflows **without automatic exercise selection**. The `select_exercise(room, count)` catalog interface is already room-keyed and reusable later, but no routes, exercise banks, or automatic execution are enabled in the other Labs by this change. The user may cancel Training using its existing cancellation control.

## Sources versus actual runtime assets

`apps/local-ai-agents-lab/exercise_library.py` is a **trusted, bundled, independently authored** exercise bank. Original references from Dolly 15k and UltraChat 200k are **methodology citations, not live dataset downloads or embedded upstream examples**. No source code or data is imported from these external projects.

This is deliberately the first phase of automation: the user does not curate tasks, while source ingestion stays offline-reviewed and reproducible. Future direct ingestion of actual open-source samples requires a separate source- and license-aware import design, test/holdout isolation, data-size caps, provenance records, and explicit security review. Live pulling from external services is not present.

The new automatic endpoint rejects requests targeting any other Lab, even if called directly. Conference Room, Evaluation Lab, Advisory Lab and Optimization Lab continue to use the original manual `POST /api/run` route.

## Unchanged guarantees

- Exactly five Labs with fifteen independently editable role prompts.
- Existing `POST /api/run` validation for supplied topics and existing role sequences.
- Fixed-loopback Ollama only for agent inference; no cloud inference fallback.
- No automatic third-party downloads, API keys, dependency installs, external code, or network access for the agents.
- No new training worker, fine-tuning, model-weight changes, or new timer/background recurrence.
- No change to the currently published Windows ZIP or Cloudflare Pages landing; the release packaging manifest **will include** the new module when a future ZIP is intentionally built.
- Existing session history and evaluations stay intact; the additive nullable SQLite `messages.exercise_id` column is the authoritative automatic-selection marker. The `[AUTO EXERCISE: ...]` prefix is display text only. Legacy rows remain unmarked and readable.

## Testing and rollout

New regression tests cover the bank shape, constraints, deterministic rotation, legacy database migration, manual topics (including spoofed `[AUTO EXERCISE:` prefixes), two sequential automatic runs, the automatic HTTP route, unchanged manual route, and UI/packager inclusion.

Before an updated Windows ZIP is released: on a local Windows PC with Ollama running, open Training Lab, select installed models for all four roles, leave the topic empty, press Start, and verify completed stages, saved `exercise_id`, response history, and the next rotated exercise. Then verify a custom Training topic still uses the manual route and each of the other four Labs still requires a topic. CI uses mocked Ollama and does not replace this manual check.

Review and merge this feature independently of the documentation-only educational-catalog PR.
