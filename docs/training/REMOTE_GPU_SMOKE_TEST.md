# Provider-independent Remote GPU Smoke Test

## Scope and boundary

Phase 2C-A prepares a developer-operated, isolated GPU-host smoke test for
`AI-LAB-OBJ-006`. It does not add a remote provider, network endpoint,
credential, upload, model download, or production activation. The Local Lab
remains locked: its `POST /api/training/jobs` route returns HTTP 423 before it
can construct a job or subprocess.

```text
AI Training Lab interface (locked)
            |
            X  no remote API or executor exists in this release

Approved developer procedure
            |
            v
Local executor or future remote executor -- job.json --> shared LoRA worker
                                                        |          |
                                                   status.json   adapter/
                                                        \          /
                                                         v        v
                                                   local artifacts and evaluation
```

The worker is deliberately provider-independent. A future executor may be a
manual SSH session, an approved batch runner, or another isolated service, but
it must stage the same files and invoke the same worker directly. It must not
accept arbitrary commands from the Lab UI.

## Job execution contract

`training/job_contract.py` defines the JSON contract shared by the worker and
the readiness probe. Every job has these fields:

| Field | Meaning |
|---|---|
| `jobId` | Alphanumeric/hyphen job identity for status correlation. |
| `modelPath` | Pre-staged, local Transformers model directory. |
| `datasetPath` | Pre-staged local JSONL file containing non-empty `text` fields. |
| `outputPath` | Existing, writable local job-output directory. |
| `statusPath` | Local JSON status-file location. |
| `method` | Only `lora`: supervised LoRA adapter training, never full-parameter tuning. |
| `device` | `cuda`, `cpu`, or `auto`; an explicit unavailable CUDA request fails. |
| `epochs`, `batchSize`, `maxLength` | Bounded training configuration; Phase 2C-B uses `1`, `1`, and `512`. |
| `timeoutSeconds` | Executor-owned upper bound; Phase 2C-B uses `1800`. |

The worker writes `running`, `completed`, or `failed` status with diagnostics
and returns process exit code 0 only after `adapter/adapter_config.json` exists.
It always calls Transformers with `local_files_only=True`; the execution host
must set `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1` during the actual run.

## Readiness probe

Run the read-only probe before any smoke test:

```text
python training/readiness.py /isolated/jobs/gpu-smoke-001.json
```

It reports OS/Python, system RAM, free disk, exact pinned package versions,
CUDA model and VRAM when PyTorch can inspect it, model/dataset presence, and
output-directory writability. It never creates a directory, imports a model,
or contacts a provider. `READY` means the declared contract was observed;
`NEEDS SETUP` means packages, inputs, output, or selected CUDA are missing;
`BLOCKED` means the job contract is invalid; `NOT VERIFIED` is reserved for
an executor that cannot collect a required host fact.

## Proposed Phase 2C-B smoke input

- Model: `sshleifer/tiny-gpt2` at immutable revision
  `5f91d94bd9cd7190a9f3216ff93cd1dd95f2c7be` from the Hugging Face model
  repository. It is a Transformers-compatible causal-language-model test
  artifact; it is not intended for useful behavior.
- License: **not declared by that repository**. The repository has no model
  card or license file. It therefore requires explicit owner approval for this
  narrow technical smoke test, or substitution with an approved, licensed
  model before download.
- Estimated minimum host resources: an NVIDIA CUDA-capable GPU with at least
  4 GiB VRAM, 8 GiB system RAM, and 8 GiB free disk for the isolated Python
  environment, caches, logs, and outputs. These are planning estimates, not
  measured requirements; the readiness report and actual run decide fitness.
- Dataset: exactly one synthetic JSONL record such as
  `{"text":"Synthetic LoRA smoke-test sentence."}`. It is staged outside
  Git with model and output artifacts.

Before the real run, an approved operator downloads the pinned revision once,
checks its source/revision and local contents, then disconnects or blocks
egress for the worker. No `trust_remote_code` is permitted.

## Approved future procedure, pending separate authorization

1. Select and manually create an approved isolated NVIDIA GPU host. Record
   provider, GPU, driver, CUDA/PyTorch evidence, cost limit, and teardown owner.
2. Create a Python 3.11 or 3.12 virtual environment and install exactly
   `training/requirements.txt`; do not alter the pins without approval.
3. Obtain written approval for the selected model's license/source, stage the
   approved revision and synthetic dataset outside Git, and create an empty
   writable output directory.
4. Create a job JSON matching the contract and run the readiness probe. Proceed
   only when it returns `READY` for `device: "cuda"`.
5. With outbound network disabled, run the worker under a 1,800-second timeout
   and host resource limits, for example an executor-owned Linux `timeout`
   wrapper and memory/CPU limits. Capture only sanitized status and package
   diagnostics.
6. Verify exit code 0, completed status, `adapter/adapter_config.json`, and
   local adapter reload in a separate offline process. Preserve artifacts only
   in the approved isolated workspace, then manually tear down the GPU host.

No real GPU integration has run in Phase 2C-A. Mocked tests prove contract and
failure handling only; they do not establish CUDA or provider compatibility.

## Future transport and authentication

A later remote executor should use an operator-approved private network or
short-lived, scoped SSH credentials supplied outside Git, with host-key
verification, allowlisted artifact paths, an immutable job manifest, and
egress-denied worker execution. The Local Lab must never store cloud keys or
accept a remote hostname, shell command, or arbitrary artifact URL. This is a
proposal, not an implemented control plane.
