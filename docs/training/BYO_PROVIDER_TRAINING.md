# Personal Provider Fine-Tuning — Phase 3A

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

## Explicitly deferred

Phase 3B requires a new approved security review before adding: Windows
user-scoped credential storage, provider authentication, provider API calls,
model/dataset transfer, cost quotation, provisioning, remote job status,
cancellation, artifact retrieval, and teardown.

No provider adapter may accept an arbitrary URL, shell command, or credential
from the UI. A future provider adapter must use an allow-listed provider API,
show a final cost/data-transfer confirmation, and preserve the existing local
inference and SQLite boundaries.
