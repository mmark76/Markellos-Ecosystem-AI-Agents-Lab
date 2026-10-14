# Four-Department Local Workflow

Scope: `AI-LAB-SCOPE-016`, approved by the direct task request on 2026-10-14.

The Local Lab remains a loopback-only Ollama application. Conference Room is an independent collaboration workspace and retains its own conversation history. It does not produce pipeline records.

```text
Training Lab (Trainer → Student, immutable Chat Log)
  → Evaluation Lab (Evaluator Scorecard, read-only input)
  → Optimization Lab (Improver draft proposal)
  → explicit Approve → explicit Apply → next Training Lab session
```

`features/workflow.py` owns the additive SQLite migration and the three pipeline hand-offs. `server.py` is the boundary adapter: it validates loopback HTTP input, supplies the fixed Ollama provider, and starts serial local execution. The browser is presentation only; it cannot choose provider URLs or modify a completed training record.

New records carry `architecture_version = four-department-v1`. Legacy `messages`, `training_sessions`, and `training_stages` tables are retained without modification, so prior history remains recoverable and distinguishable from new departmental records.

Scorecards retain their raw evaluator output plus a normalized structure. Every model assertion is labelled `model_judgment`; the original task and immutable Chat Log are explicitly recorded as traceable input evidence. Optimization records retain original and proposed prompts. Applying a prompt revision requires two separate local actions: approve the draft, then apply the approved revision. Previous revisions remain in SQLite and can be selected through the rollback endpoint. Prompt optimization changes only future system-prompt configuration; it does not train or modify neural-network weights.
