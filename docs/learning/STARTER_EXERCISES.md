# Starter Exercises — Five Labs, Fifteen Roles

These five **original, text-only practice tasks** can be used in the existing AI Training Lab without installing software, importing datasets, adding agents, or changing system prompts.

[Return to the curated resource catalog](EDUCATIONAL_RESOURCE_LIBRARY.md).

## Operating rules

- Copy the **User task** text for the relevant Lab into its existing input. Run the Lab's existing sequential workflow with locally installed Ollama models.
- Do not replace the Lab's role-specific system prompts, use external network endpoints, or treat the task text as an instruction to execute software.
- The sample details below are **hypothetical**. Agents must distinguish statements in the exercise from verified system facts.
- Review agent output against the **Success criteria** manually. These examples are not externally validated benchmarks, do not change model weights, and are not automatically scored.
- The Evaluation Lab's separate review of a completed Training session may be used where available; keep that stored assessment distinct from the Training Evaluator's in-session feedback.

## Exercise 1 — Conference Room (Strategist → Analyst → Engineer)

**Objective:** Practice collaboration through feasible, testable planning.

**User task — copy into Conference Room:**

```text
Scenario: A small team wants a fully local, text-only AI training exercise
library for a Windows laptop. It must preserve five existing workspaces,
fifteen existing agent roles, and their role-specific system prompts.
No background downloads, cloud inference, file execution, or configuration
changes are authorized.

Propose a minimal educational-resource workflow. Compare (A) linking to
curated external references and manually adapting tasks with (B) importing
full datasets into the application. Identify missing facts, dependencies,
risks, a controlled first step, and criteria to verify that architecture
and local privacy boundaries remain unchanged. Do not implement changes.
```

**Success criteria:**
1. Explains the trade-off between linking and importing; no invented cost or compatibility claim.
2. States the no-download, no-execution and unchanged-role constraints.
3. Supplies a feasible first step and a verification checklist.
4. Separates observed requirements from unknown assumptions.

## Exercise 2 — Training Lab (Tutor → Student → Evaluator → Improver)

**Objective:** Practice identifying evidence, assumptions and unknowns.

**User task — copy into Training Lab:**

```text
Topic: Evidence vs. assumption vs. unknown in an AI engineering report.

Teach the distinction briefly and use the following hypothetical statements
as exercise material:
A. The written project brief says the local application uses Ollama.
B. The user's laptop has 32 GB of RAM, but no device information is supplied.
C. A previously captured test log records an execution time of 12 seconds.
D. Because one response was fast, this model will always be faster.
E. No measured before/after results have been supplied for the proposed change.

Give a concise classification exercise with clear success criteria. The
Student must classify and justify; the Evaluator must cite the supplied
evidence; the Improver must correct mistakes without making up measurements.
```

**Success criteria:**
1. Treats A and C as **claims supplied by the hypothetical scenario** (not independently verified facts about the real Lab).
2. Marks B as unknown, D as an unjustified generalization, and E as a statement about absent evidence.
3. Student justifies each classification; Evaluator points to concrete wording.
4. Improver preserves correct work, fixes errors and recommends one further exercise.

## Exercise 3 — Evaluation Lab (Assessor → Scorer → Benchmarker)

**Objective:** Practice explicit grading and conservative benchmark comparisons.

**Prepare:** Complete Exercise 2 in Training Lab. Use the existing Evaluation Lab flow to select/review that completed session if supported by the current UI.

**Review task / manual checklist:**

```text
Review the completed Training Lab session for:
(1) correct distinction between supplied claims, assumptions and unknowns,
(2) traceable references to the provided exercise,
(3) justified uncertainty, and
(4) clarity of corrective feedback.

Use the same written rubric for all compared sessions. Do not infer factual
verification from model output. If there is no second run under matched
conditions, report "no comparable benchmark" rather than a ranking.
```

**Success criteria:**
1. Assessor identifies specific excerpts and absent evidence.
2. Scorer follows a declared rubric and explains each score.
3. Benchmarker refuses an unjustified comparison without matched conditions.
4. The original Training session remains unchanged by the evaluation.

**Important:** The checklist is an educational guide for interpreting the existing Evaluation Lab; it is not an automatic new scoring configuration or a third-party benchmark integration.

## Exercise 4 — Advisory Lab (Analyst → Advisor)

**Objective:** Recommend a proportionate and privacy-preserving learning strategy.

**User task — copy into Advisory Lab:**

```text
A local-first AI lab wants to teach prompt engineering. Two options are
under consideration: (A) links to trusted prompt libraries plus manually
reviewed examples, or (B) automatic download and ingestion of external
prompts and datasets at startup.

Known constraints: preserve the existing agents and role prompts; no
unapproved downloads; no cloud transfer of local conversations; prioritize
traceability, copyright awareness, and low maintenance.

Analyze the options, identify uncertain assumptions, and recommend a
controlled next step. Advice only; do not implement or change settings.
```

**Success criteria:**
1. Gives a recommendation grounded in the stated constraints.
2. Distinguishes source quality/licensing checks from technical compatibility.
3. Identifies at least one uncertainty requiring confirmation.
4. Recommends without implying any action was executed.

## Exercise 5 — Optimization Lab (Diagnostician → Optimizer → Validator)

**Objective:** Specify a reversible prompt-workflow improvement and a fair test.

**User task — copy into Optimization Lab:**

```text
A draft exercise prompt says: "Analyze this project and improve it."
Users report vague outputs, but no baseline scores or repeatable test results
are available.

Propose a *prompt-only* improvement that adds an explicit task boundary,
deliverables and success criteria. Explain how to compare the old and
revised prompts under matched model, input, settings and grading conditions.
List missing measurements and a rollback step. Do not change code, model
weights, stored configurations, or running services.
```

**Success criteria:**
1. Diagnostician labels vague task scope as a hypothesis, not a proven root cause.
2. Optimizer proposes a concrete, reversible revised prompt with measurable criteria.
3. Validator defines matching test conditions and requires actual comparative results.
4. No unsupported claim of measured improvement or actual execution.

## Optional manual scoring worksheet

For every exercise, a human reviewer may record five dimensions with **0 / 1 / 2** points each (maximum **10**). These are local learning notes, **not** calibrated scientific benchmark scores.

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| Scope adherence | Violates key constraints | Partial adherence | All stated constraints respected |
| Evidence discipline | Invents evidence or verification | Mixed support | Supports and qualifies claims |
| Task coverage | Missing required deliverables | Partially complete | Meets all declared success criteria |
| Uncertainty handling | Presents unknowns as facts | Some uncertainty stated | Explicitly separates facts, assumptions and missing data |
| Clarity and testability | Unclear or untestable | Partly clear | Clear output with observable checks |

Record: **date**, **Lab and role flow**, **input/task revision**, **model and version for each role**, **available inference settings**, **rubric version**, **supporting excerpts**, **human scores**, and **unresolved questions**. Avoid comparing results across differing conditions.

## Beyond the starter tasks

The [resource catalog](EDUCATIONAL_RESOURCE_LIBRARY.md) lists original providers for additional prompts, instruction datasets and benchmark *methodologies*. Review a source and its use permissions first, then manually adapt a small, non-sensitive exercise. Do **not** copy benchmark evaluation questions into a training set and subsequently report performance on the same questions as independent generalization.
