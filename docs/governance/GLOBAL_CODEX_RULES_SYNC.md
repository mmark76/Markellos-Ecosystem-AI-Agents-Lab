# Synchronizing Global Codex Rules

`GLOBAL_CODEX_RULES.md` at the root of `mmark76/ecosystem-framework` is the canonical source for the shared cross-repository Codex rules.

Each repository receives a portable copy in its effective root Codex instruction file:

- use root `AGENTS.override.md` when it already exists;
- otherwise use root `AGENTS.md`;
- do not create a competing root override as an inheritance layer.

The portable block is delimited by versioned managed markers. Content outside those markers remains repository-owned and must be preserved.

## Safe update procedure

1. Verify the target repository's branch, `HEAD`, remote-tracking state, working tree, open pull requests, and any existing `chore/adopt-global-codex-rules` branch.
2. Create an isolated task branch from the verified intended base.
3. From `ecosystem-framework`, preview the update:

   ```text
   python scripts/sync_global_codex_rules.py /path/to/repository
   ```

4. Review the dry-run diff. Confirm that only the managed block is created or updated and that repository-specific content remains intact.
5. Apply the reviewed update:

   ```text
   python scripts/sync_global_codex_rules.py /path/to/repository --write
   ```

6. Inspect the final diff, verify the version and markers, commit the focused change, and open a pull request. Do not force-push or merge automatically.

The helper has no third-party dependencies. It is dry-run by default, never runs Git commands, never reads credentials, and never pushes or merges.
