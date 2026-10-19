"""Inactive, room-keyed exercise selection scaffold; the runtime catalog is empty.

Exercises, datasets and external resources are not bundled or imported.
"""
from __future__ import annotations

from typing import TypedDict


class Exercise(TypedDict):
    id: str
    title: str
    reference: str
    source_type: str
    task: str


# Future per-Lab catalog. No exercise content is shipped or activated yet.
EXERCISES: dict[str, tuple[Exercise, ...]] = {}

def select_exercise(room: str, completed_auto_selections: int) -> Exercise:
    """Deterministically rotate the room's vetted tasks; selection needs no user input."""
    if type(completed_auto_selections) is not int or completed_auto_selections < 0:
        raise ValueError("Invalid exercise selection count.")
    options = EXERCISES.get(room)
    if not options:
        raise ValueError("No curated exercises for the selected Lab.")
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
