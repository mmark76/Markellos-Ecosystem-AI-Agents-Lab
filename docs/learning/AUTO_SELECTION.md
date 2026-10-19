# Automatic Exercise Engine — Future Feature (Under Construction)

**Decision (2026-10-19):** Keep only the foundational, extensible automatic exercise
selection mechanism and **remove all active exercises** from the Training Lab runtime
library. The visible status in the Training Lab is **Unavailable - Under Construction**.
This is not an active automatic training feature.

## Current behavior

1. Training Lab shows the status **Unavailable - Under Construction** and
   **Exercise Library: 0 exercises available**. The status is informational;
   there is no automatic Start control.
2. Training Topic is required. Submitting a topic or question uses the
   existing `POST /api/run` flow with local Ollama and the unchanged
   **Tutor → Student → Evaluator → Improver** roles.
3. `POST /api/auto-run` remains a reserved, disabled interface: Training Lab
   requests receive HTTP 503 and a clear status message **before** any session
   or inference starts. Requests for the other four Labs remain rejected with
   HTTP 400. No empty-topic session starts.
4. `exercise_library.py` retains its room-keyed `EXERCISES` registry,
   `select_exercise(room, count)` and `format_exercise(exercise)`, but
   the shipped catalog is empty. Selection without an exercise raises a
   clear `ValueError`; no runtime worker calls the selector.
5. The SQLite `messages.exercise_id` nullable provenance field and related
   server helpers are retained for future adoption; previously saved history,
   including any prior experimental automatic records, is not deleted.
   Ordinary manual messages have a NULL exercise ID.

## Scope and boundaries

- Exactly five Labs and fifteen existing independent role prompts remain.
- Only Training Lab shows the future-feature status. Conference Room,
  Evaluation Lab, Advisory Lab and Optimization Lab keep manual workflows.
- No embedded exercise contents or runtime fetching from GitHub/Hugging Face;
  educational reference documents from PR #171 remain documentation only.
- No new fine-tuning, autonomous recurrence, model-weight modifications,
  cloud inference or external resource execution.
- The generic room-keyed selection interface can be activated for a Lab
  only in a later separately approved change. This PR activates **no Lab**.
- The future Windows release packaging list includes `exercise_library.py`
  as inactive source code. The existing distributed ZIP and Cloudflare Pages
  production deployment are unchanged by this PR.

## Verification and next activation

Regression tests use temporary synthetic fixtures to verify the inactive
selector's behavior without shipping exercises. API tests verify Training
`/api/auto-run` returns 503, other Labs reject auto-run, blank manual topics
are invalid and a real manual Training session can still complete with mocked
local models. CI verification does not constitute a real Ollama test.

To activate later: approve suitable content, source/provenance handling,
runtime route/UI behavior, test coverage and a controlled Windows Ollama
smoke test in a **separate** change. Keep this PR open until reviewed and
explicitly approved for merge.
