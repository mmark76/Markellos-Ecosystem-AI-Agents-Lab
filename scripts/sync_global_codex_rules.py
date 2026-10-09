#!/usr/bin/env python3
"""Synchronize the canonical global Codex rules into a repository root file."""

from __future__ import annotations

import argparse
import difflib
import sys
from pathlib import Path


BEGIN_MARKER = "<!-- BEGIN SHARED GLOBAL CODEX RULES v1.0.0 -->"
END_MARKER = "<!-- END SHARED GLOBAL CODEX RULES -->"
PRECEDENCE = (
    "Repository-specific instructions below specialize these shared defaults and "
    "take precedence when they conflict. More deeply nested applicable Codex "
    "instruction files remain more specific."
)


class SyncError(RuntimeError):
    """Raised when a safe managed-block update cannot be determined."""


def effective_root_instruction(repo: Path) -> Path:
    override = repo / "AGENTS.override.md"
    agents = repo / "AGENTS.md"
    if override.is_file() and override.read_text(encoding="utf-8").strip():
        return override
    return agents


def managed_block(canonical: str) -> str:
    rules = canonical.strip()
    if "Global Codex Rules Version: 1.0.0" not in rules:
        raise SyncError("canonical rules do not declare version 1.0.0")
    return f"{BEGIN_MARKER}\n\n{rules}\n\n{END_MARKER}"


def synchronize(existing: str, canonical: str) -> str:
    block = managed_block(canonical)
    begin_count = existing.count("<!-- BEGIN SHARED GLOBAL CODEX RULES")
    end_count = existing.count(END_MARKER)

    if begin_count != end_count or begin_count > 1:
        raise SyncError("managed markers are missing, duplicated, or unbalanced")

    if begin_count == 1:
        begin = existing.index("<!-- BEGIN SHARED GLOBAL CODEX RULES")
        end = existing.index(END_MARKER, begin) + len(END_MARKER)
        updated = existing[:begin] + block + existing[end:]
    elif existing.strip():
        updated = f"{block}\n\n{PRECEDENCE}\n\n{existing.lstrip()}"
    else:
        updated = f"{block}\n"

    return updated.rstrip() + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Update only the managed global-rules block in a repository's "
            "effective root Codex instruction file. Dry-run is the default."
        )
    )
    parser.add_argument("repository", type=Path, help="repository root to inspect")
    parser.add_argument(
        "--canonical",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "GLOBAL_CODEX_RULES.md",
        help="canonical GLOBAL_CODEX_RULES.md path",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="write the verified update; without this flag only show a diff",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo = args.repository.resolve()
    canonical_path = args.canonical.resolve()

    if not repo.is_dir():
        raise SyncError(f"repository root does not exist: {repo}")
    if not canonical_path.is_file():
        raise SyncError(f"canonical rules file does not exist: {canonical_path}")

    target = effective_root_instruction(repo)
    existing = target.read_text(encoding="utf-8") if target.exists() else ""
    canonical = canonical_path.read_text(encoding="utf-8")
    updated = synchronize(existing, canonical)

    if updated == existing:
        print(f"Already synchronized: {target}")
        return 0

    diff = difflib.unified_diff(
        existing.splitlines(keepends=True),
        updated.splitlines(keepends=True),
        fromfile=str(target),
        tofile=str(target),
    )
    sys.stdout.writelines(diff)

    if args.write:
        target.write_text(updated, encoding="utf-8", newline="\n")
        print(f"Updated: {target}")
    else:
        print("Dry run only; rerun with --write after reviewing the diff.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SyncError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(2)
