# Personal Provider Fine-Tuning — Phases 3A and 3B

## Scope

`AI-LAB-SCOPE-019` introduces a local, user-owned provider planning surface in
the private Windows AI Training Lab. It is the first step toward a user-managed
remote LoRA workflow: the user selects a provider, region preference, maximum
runtime, and maximum spend before any remote execution is possible.

The first provider identifier is `runpod`. The internal plan contract is
provider-neutral so a later reviewed adapter can support another provider.

## Privacy, billing, and trust boundary

- The Lab remains a loopback-only local application.
- Provider charges belong directly to the user's own provider account.
- This phase accepts no API key, SSH key, password, endpoint URL, dataset,
  model download, or remote command.
- The plan endpoint is same-origin and host-checked. It performs only in-memory
  validation; it makes no network request, write, subprocess, or paid action.
- `/api/training/jobs` remains locked with HTTP 423 before subprocess creation.

## Phase 3B — local token custody only

`AI-LAB-SCOPE-020` adds an optional input for an allow-listed RunPod access
token. The token is posted only to the loopback Lab after an explicit user
action and confirmation. The Lab protects it through Windows DPAPI and writes
only the encrypted blob under the current user's Local App Data directory,
outside the repository, SQLite database, release package, and backups.

- Status shows only whether a blob is present for the current Windows user.
- The Lab never returns the token to the browser, logs, or status endpoint.
- The user can explicitly remove the blob; removal is not recoverable.
- DPAPI is tied to the Windows user and normally the same computer. It is not
  a cross-device sync, team credential, or defense against a compromised
  process already running as that Windows user.
- No provider request, account validation, pricing lookup, upload,
  provisioning, model download, job launch, or training occurs in Phase 3B.

## Explicitly deferred

Provider authentication and all use of the locally protected token require a
new explicit approval: provider API calls, cost quotation, model/dataset
transfer, provisioning, remote job status, cancellation, artifact retrieval,
and teardown remain deferred.

No provider adapter may accept an arbitrary URL, shell command, or credential
from the UI. A future provider adapter must use an allow-listed provider API,
show a final cost/data-transfer confirmation, and preserve the existing local
inference and SQLite boundaries.
