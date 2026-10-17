# Personal Provider Fine-Tuning — Active Connection, Phases 3A, 3B, and 3C-A

## Scope

`AI-LAB-SCOPE-020` introduces a local, user-owned provider planning surface in
the private Windows AI Lab. It is the first step toward a user-managed
remote LoRA workflow: the user selects a provider, region preference, maximum
runtime, and maximum spend (EUR or USD) before any remote execution is possible.

The first provider identifier is `runpod`. The internal plan contract is
provider-neutral so a later reviewed adapter can support another provider. The
Personal Provider area is active for plan review, encrypted local token custody,
and an explicit read-only RunPod connection check; it is not labelled as an
unfinished feature.

## Privacy, billing, and trust boundary

- The Lab remains a loopback-only local application.
- Provider charges belong directly to the user's own provider account.
- The visible **Open RunPod Console** link opens only the official RunPod Console
  in a new browser tab after an explicit user click. It gives the user a direct
  route to connect to and manage their own RunPod servers there; the Lab cannot
  create a provider resource or charge an account.
- RunPod API tokens and SSH public keys are credentials that provide a direct
  connection to the user's own account or an already-running server. By
  themselves, they cannot create a server, start a job, or create a charge.
- The visible **Open OpenAI API Platform** link is the analogous direct route
  for a user's own OpenAI API account. The Lab does not accept, store, or use
  OpenAI API keys, and it cannot make OpenAI API requests or charges. Any
  OpenAI API use is managed directly in the user's OpenAI API Platform account.
- This phase accepts no API key, SSH key, password, endpoint URL, dataset,
  model download, or remote command.
- The plan endpoint is same-origin and host-checked. It performs only in-memory
  validation; it makes no network request, write, subprocess, or paid action.
- The currency selection is a personal planning label. RunPod catalog prices are
  returned in USD; the Lab neither fetches exchange rates nor claims to enforce
  a provider-side spending cap.
- `/api/training/jobs` remains locked with HTTP 423 before subprocess creation.

## Phase 3B — local token custody only

`AI-LAB-SCOPE-021` adds an optional input for an allow-listed RunPod access
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

## Phase 3C-A — explicit read-only connection check

`AI-LAB-SCOPE-022` permits one narrow use of a locally protected RunPod token:
after the user explicitly selects **Check RunPod connection**, the local Lab
sends one fixed HTTPS GraphQL query to `https://api.runpod.io/graphql` using a
Bearer header. The query confirms authentication and reads GPU names, memory,
availability labels, and listed hourly prices. The token is never placed in a
URL, returned to the browser, written to SQLite, or logged.

- The browser calls only the loopback Lab; only the local adapter contacts the
  fixed RunPod endpoint.
- The adapter has a static GraphQL query and cannot submit a mutation, accept a
  provider URL, use a shell command, or upload model or dataset data.
- The response excludes account ID, email, balance, payment details, Pods, SSH
  details, and any secret. It is displayed only in browser memory.
- This is a live provider read when the user chooses the control; it is not a
  training action and it does not create a charge.
- `/api/training/jobs` remains locked with HTTP 423.

## Active connection boundary and explicitly deferred execution

All provider actions other than the Phase 3C-A read-only check require a new
explicit approval: exact cost quotation/selection, model/dataset transfer,
provisioning, remote job status, cancellation, artifact retrieval, teardown,
and any mutation remain deferred. Saving a token or verifying an account never
starts a paid resource.

No provider adapter may accept an arbitrary URL, shell command, or credential
from the UI. A future provider adapter must use an allow-listed provider API,
show a final cost/data-transfer confirmation, and preserve the existing local
inference and SQLite boundaries.
