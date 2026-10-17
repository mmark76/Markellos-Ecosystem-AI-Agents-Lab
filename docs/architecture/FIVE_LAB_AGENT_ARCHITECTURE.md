# Five-Lab Agent Architecture

## Decision

AI Training Lab has exactly five active local workspaces. Each workspace owns its workflow, role prompts, browser model selections, and conversation history. Internal prompt identities use the form lab:role, preventing role-name collisions.

| Lab | Workflow | Agent identifiers |
|---|---|---|
| Conference Room | Strategist → Analyst → Engineer | conference:Strategist, conference:Analyst, conference:Engineer |
| Training Lab | Tutor → Student → Evaluator → Improver | training:Tutor, training:Student, training:Evaluator, training:Improver |
| Evaluation Lab | Assessment → Scoring → Benchmarking | evaluation:Assessor, evaluation:Scorer, evaluation:Benchmarker |
| Advisory Lab | Analysis → Recommendations | advisory:Analyst, advisory:Advisor |
| Optimization Lab | Diagnose → Optimize → Validate | optimization:Diagnostician, optimization:Optimizer, optimization:Validator |

The Labs use the existing fixed-loopback Ollama adapter only. They cannot access the filesystem, terminal, arbitrary network endpoints, cloud inference, or configuration mutation. Advisory output remains recommendations only. Optimization output is a reversible, measurable proposal rather than training or fine-tuning.

## Compatibility

Existing Training SQLite rows with the legacy Trainer role remain readable and are displayed as Tutor. The retained Training schema column name trainer_model stores the Tutor model for new sessions; it is a persisted-schema compatibility detail, not an active agent identifier. The existing Evaluation Lab record-review workflow remains additive and continues to preserve source records.
