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
