# Automatic Exercise Selection — Controlled Local Implementation

**Decision (2026-10-18):** Remove the user's need to find, choose, copy or paste practice exercises, while retaining the existing 5 Labs, 15 agent identities and their role-specific system prompts. This implementation is **automatic task selection when a Lab session starts**, not a scheduled or autonomous inference service.

## Actual behavior

1. User selects a Lab and installed local Ollama models using the existing controls (or their saved browser selections).
2. The topic field is optional. With a custom topic, the existing `POST /api/run` workflow is unchanged.
3. When the topic is empty and **Start** is pressed, the UI sends `POST /api/auto-run` with the existing room, provider and model assignments, but no prompt.
4. The server validates the same fixed local provider, model assignments, request origin and single-session lock.
5. It chooses a task using deterministic per-Lab rotation, counting only previously saved auto-selected user messages; manual conversations do not advance the rotation.
6. The selected original text-only exercise is persisted as the user's task in local SQLite history, alongside its exercise ID and external methodology reference URL, then flows through the same 15 unchanged role prompts and existing stage/conversation storage.
7. Every subsequent started session chooses the next local example for that Lab. There are two starter exercises in each Lab (ten total).

The existing Training Lab remains Tutor → Student → Evaluator → Improver. Evaluation Lab, Advisory Lab, Conference Room and Optimization Lab retain their own workflows. The user may cancel Training using its existing cancellation control.

## Sources versus actual runtime assets

`apps/local-ai-agents-lab/exercise_library.py` is a **trusted, bundled, independently authored** exercise bank. Original references from prompts.chat, PromptSource, Dolly 15k, UltraChat 200k, LM Evaluation Harness, Promptfoo and τ³-bench are **methodology citations, not live dataset downloads or embedded upstream examples**. No source code or data is imported from these external projects.

This is deliberately the first phase of automation: the user does not curate tasks, while source ingestion stays offline-reviewed and reproducible. Future direct ingestion of actual open-source samples requires a separate source- and license-aware import design, test/holdout isolation, data-size caps, provenance records, and explicit security review. Live pulling from external services is not present.

## Unchanged guarantees

- Exactly five Labs with fifteen independently editable role prompts.
- Existing `POST /api/run` validation for supplied topics and existing role sequences.
- Fixed-loopback Ollama only for agent inference; no cloud inference fallback.
- No automatic third-party downloads, API keys, dependency installs, external code, or network access for the agents.
- No new training worker, fine-tuning, model-weight changes, or new timer/background recurrence.
- No change to the currently published Windows ZIP or Cloudflare Pages landing; the release packaging manifest **will include** the new module when a future ZIP is intentionally built.
- Existing session history and evaluations stay intact; automatic tasks are visibly distinguishable by the `[AUTO EXERCISE: ...]` prefix.

## Testing and rollout

New regression tests cover the bank shape, constraints, deterministic rotation, no interference from manually entered topics, the automatic HTTP route, unchanged manual route, and UI/packager inclusion. Full integration with a real Ollama model should be checked locally before releasing an updated ZIP. Review and merge this feature independently of the documentation-only educational-catalog PR.
