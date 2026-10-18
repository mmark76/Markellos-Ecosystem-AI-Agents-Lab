"""Trusted, original, offline learning tasks; no remote fetching or third-party execution.

These are user-task examples, not system prompts, training weights or external datasets.
The source links are methodological references; none of their content is imported.
"""
from __future__ import annotations

from typing import TypedDict


class Exercise(TypedDict):
    id: str
    title: str
    reference: str
    source_type: str
    task: str


EXERCISES: dict[str, tuple[Exercise, ...]] = {
    "conference": (
        {
            "id": "conf-scope-01",
            "title": "Plan an offline learning catalog",
            "source_type": "prompt library",
            "reference": "https://github.com/f/prompts.chat",
            "task": (
                "Hypothetical brief: A local AI lab has five workspaces and fifteen fixed role prompts. "
                "Design a small reference-only educational catalog. Compare an offline reviewed exercise bank "
                "with live external imports. Address scope, dependencies, source permissions, privacy, "
                "trade-offs, and validation criteria. Propose rather than execute changes."
            ),
        },
        {
            "id": "conf-risk-02",
            "title": "Review a project decision",
            "source_type": "prompt templates",
            "reference": "https://github.com/bigscience-workshop/promptsource",
            "task": (
                "A hypothetical team must choose between a small manually reviewed test suite and a large "
                "unvetted dataset. State decision criteria, risks, time and resource assumptions, a feasible "
                "first step and a verification approach. Distinguish factual input from unverified estimates."
            ),
        },
    ),
    "training": (
        {
            "id": "train-evidence-01",
            "title": "Evidence versus assumptions",
            "source_type": "instruction dataset methodology",
            "reference": "https://huggingface.co/datasets/databricks/databricks-dolly-15k",
            "task": (
                "Topic: evidence, assumptions and unknowns. Tutor: teach the distinction with one brief "
                "example; then set one text-only classification exercise using these *hypothetical* statements: "
                "(A) a project brief claims Ollama is local; (B) laptop RAM is 32 GB but no measurement is "
                "provided; (C) a test record claims a 12-second run; (D) one fast run proves all future runs "
                "will be fast. Student: attempt the exercise. Evaluator: check against explicit criteria "
                "and uncertainty. Improver: correct errors and suggest one follow-up. Do not independently "
                "validate the scenario claims."
            ),
        },
        {
            "id": "train-dialogue-02",
            "title": "Follow-up question accuracy",
            "source_type": "dialogue dataset methodology",
            "reference": "https://huggingface.co/datasets/HuggingFaceH4/ultrachat_200k",
            "task": (
                "Topic: consistent multi-turn reasoning. Tutor: teach how follow-up questions retain "
                "previous constraints, and set one small text-only dialogue exercise with a changed "
                "requirement. Student: answer while identifying retained and changed constraints. "
                "Evaluator: use clear observable criteria and cite the supplied dialogue. "
                "Improver: address weaknesses without assuming missing details."
            ),
        },
    ),
    "evaluation": (
        {
            "id": "eval-rubric-01",
            "title": "Apply a reproducible rubric",
            "source_type": "evaluation harness methodology",
            "reference": "https://github.com/EleutherAI/lm-evaluation-harness",
            "task": (
                "Hypothetical candidate response: 'All results are verified and the new prompt is 30% "
                "better.' No raw measurements or baseline are supplied. Assessor: identify supported and "
                "unsupported claims. Scorer: propose an explicit 0-2 rubric for evidence, accuracy and "
                "uncertainty, with explanations. Benchmarker: say whether a reproducible comparison is "
                "possible, and specify the data needed. Do not manufacture scores as measured results."
            ),
        },
        {
            "id": "eval-agentic-02",
            "title": "Evaluate simulated agent decisions",
            "source_type": "agent benchmark methodology",
            "reference": "https://github.com/sierra-research/tau2-bench",
            "task": (
                "Hypothetical agent scenario: A user requests a file edit, but the agent has no filesystem "
                "tools. The response says 'the file is updated' without evidence. Assessor: identify "
                "the unsupported claim and safer response. Scorer: define transparent criteria. "
                "Benchmarker: state what equivalent runs and real evidence would be necessary for "
                "comparison. This is a text-only scenario; do not attempt tool use."
            ),
        },
    ),
    "advisory": (
        {
            "id": "adv-privacy-01",
            "title": "Advise on responsible resource selection",
            "source_type": "prompt library",
            "reference": "https://github.com/f/prompts.chat",
            "task": (
                "A hypothetical local lab wants to reuse open prompt examples but cannot silently import "
                "remote code or send user conversations outside the device. Analyst: compare vetted "
                "local examples with automatic external ingestion and identify missing information. "
                "Advisor: recommend a controlled, privacy-preserving path with source attribution."
            ),
        },
        {
            "id": "adv-dataset-02",
            "title": "Advise on dataset suitability",
            "source_type": "instruction dataset methodology",
            "reference": "https://huggingface.co/datasets/databricks/databricks-dolly-15k",
            "task": (
                "A team is considering instruction-response datasets for a small offline reasoning "
                "exercise. Assess quality, provenance, attribution duties, privacy, possible test "
                "contamination and limitations of generated answers. Recommend a review process "
                "without assuming any dataset has already been downloaded or legally cleared."
            ),
        },
    ),
    "optimization": (
        {
            "id": "opt-scope-01",
            "title": "Tighten an ambiguous instruction",
            "source_type": "prompt testing methodology",
            "reference": "https://github.com/promptfoo/promptfoo",
            "task": (
                "Draft user instruction: 'Analyze this and make it better.' Diagnostician: identify "
                "plausible reasons for vague outputs without claiming verified causes. Optimizer: "
                "write a narrower prompt with explicit output and success criteria. Validator: "
                "propose a fair before/after test using fixed inputs, models and settings, and "
                "state that no improvement is yet measured. Do not execute changes."
            ),
        },
        {
            "id": "opt-benchmark-02",
            "title": "Design a repeatable test",
            "source_type": "benchmark methodology",
            "reference": "https://github.com/EleutherAI/lm-evaluation-harness",
            "task": (
                "A team reports improved reasoning after rewriting a prompt, but only two different "
                "questions were tested on different model versions. Diagnose comparison limitations, "
                "propose a small reversible prompt change and a controlled matched-condition test. "
                "List what must be held constant and how to report absent results."
            ),
        },
    ),
}


def select_exercise(room: str, completed_auto_selections: int) -> Exercise:
    """Deterministically rotate the room's vetted tasks; selection needs no user input."""
    options = EXERCISES.get(room)
    if not options:
        raise ValueError("No curated exercises for the selected Lab.")
    if type(completed_auto_selections) is not int or completed_auto_selections < 0:
        raise ValueError("Invalid exercise selection count.")
    return options[completed_auto_selections % len(options)]


def format_exercise(exercise: Exercise) -> str:
    """Keep the chosen task and its provenance visible in the saved conversation."""
    formatted = (
        f"[AUTO EXERCISE: {exercise['id']}] {exercise['title']}\n"
        f"Educational source type: {exercise['source_type']}\n"
        f"Methodology reference (not downloaded): {exercise['reference']}\n"
        f"Original, locally authored task: {exercise['task']}\n"
        "Apply the existing Lab roles and restrictions. Treat hypothetical inputs as unverified."
    )
    if len(formatted) > 1500:
        raise ValueError("Exercise exceeds the existing transcript limit.")
    return formatted
