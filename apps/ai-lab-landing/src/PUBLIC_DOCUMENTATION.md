# AI Training Lab — Technical README

**Public current-state documentation** · Checked against repository source on **28 October 2026**

**Local application source version:** {{LOCAL_LAB_VERSION}} · **Previous STABLE Cloudflare R2 milestone:** {{PUBLIC_MILESTONE_VERSION}}

This Technical README explains the software, runtimes, AI models, integrations, system requirements and current limits of **AI Training Lab**. It documents the implementation in the repository, rather than guaranteeing that an optional external account connection has been tested successfully on an individual computer. The source version and the previous STABLE R2 milestone may differ; the owner-approved current STABLE GitHub release is presented separately on the [public landing page](https://ai-lab.markellosecosystem.com/).

For step-by-step installation, use the [README / Installation Guide](./simple-guide.html). For what the five workspaces actually do, see [Detailed App Description](./app-description.html).

## 1. Product boundary and architecture

AI Training Lab is a **Windows-based, local-first** experimental application with five active workspaces and fifteen agent roles. It is **not** a hosted AI service, a public chat API, an accredited educational institution or a system that autonomously edits a computer or retrains model weights.

```text
Public browser ── Cloudflare Pages landing page
                       │
                       └── Windows ZIP download (current STABLE / current BETA GitHub; older R2 in archive)
                                    │
Local Windows PC                    ▼
  Browser ── http://127.0.0.1:8765 ── Python Lab server
                                         ├── Local Ollama inference
                                         │     http://127.0.0.1:11434
                                         ├── SQLite session history
                                         │     data/campus.sqlite3
                                         ├── Optional ChatGPT Advisor
                                         │     explicit external question only
                                         └── Optional RunPod connection
                                               read-only GPU/account query
```

The **public landing page** distributes information and release links; it never hosts local conversations, the Ollama service, or the SQLite database. The public page uses the central **cookie-less aggregate analytics** collector for overall traffic counts; this does **not** add analytics to the local Lab. The local agent workflows can run offline once the required software and local model files are installed.

## 2. Software compatibility matrix

“Implemented” describes the released code path; it does not claim that every external service has passed a live account test. “Developer tooling” is not required by someone running the packaged Windows ZIP.

| Software or service | Role | Current status |
| --- | --- | --- |
| **Windows** | Packaged application, launchers and user-scoped integrations | **Officially supported host** |
| **Python** | Local HTTP server, agent orchestration, persistence and integrations | **Required**; Easy Start offers Python 3.12 |
| **Windows PowerShell** | Local launch, readiness checks and consent-based setup | **Required by Windows launchers** |
| **Windows Package Manager (winget)** | Installs missing Python/Ollama with user approval | **Required for first-time automatic installation** |
| **Ollama** | Local inference and local model discovery/downloads | **Only supported agent inference engine** |
| **SQLite** | Local workspace history, assessments and Advisor Q&A | **Built in** through Python |
| **Web browser** | Local UI at `127.0.0.1:8765` | **Required** |
| **ChatGPT** | Separate, user-initiated external Advisor | **Optional integration**; account eligibility applies |
| **PyJWT[crypto]** | Identity-token verification for optional ChatGPT sign-in | **Optional isolated dependency** |
| **RunPod** | Protected personal token and account/GPU catalogue query | **Optional, read-only**; no remote training |
| **PyTorch / Transformers / PEFT / TRL / Accelerate / Datasets** | Isolated local LoRA/SFT training preparation | **Retained developer infrastructure; training locked** |
| **Node.js** | Landing-page build, Windows packaging and automated tests | **Developer tooling only** |
| **GitHub / GitHub Actions** | Source, CI, verified GitHub releases | **Development and release infrastructure** |
| **Cloudflare Pages / R2** | Public static documentation and reviewed release archives | **Public delivery infrastructure** |
| **LM Studio / Jan / vLLM / separate llama.cpp server** | Alternative AI inference providers | **Not supported as Lab inference backends** |

### Distinguishing a model from an inference engine

An **inference engine** serves model requests; a **model** produces the response. The Lab supports **Ollama only as the inference engine**, but it can use different locally installed model families *through Ollama*. A model appearing in Ollama is not proof that its every capability is supported by the Lab: the released agent workflow is primarily text chat, not a general multimodal, tool-use or embedding platform.

## 3. Core runtime: Windows, Python and Ollama

### Windows and Python

Easy Start is launched using `Start AI Training Lab.bat`. It reuses compatible existing components; otherwise it requests **separate confirmation** before installing Python, installing Ollama, starting Ollama, or downloading the initial model. Its preferred Python installation is **3.12**; the base launcher accepts compatible **Python 3.9+** versions. The training-only environment has narrower requirements, described in Section 7.

The normal Lab server uses the Python **standard library**, including local HTTP and SQLite support. **PyTorch is not required** for the five regular agent workspaces. The supported packaged setup is **Windows**: portable Python modules do not constitute an officially verified macOS or Linux application release.

### Ollama: one fixed local provider

The Lab connects only to Ollama at `http://127.0.0.1:11434`. The Python server itself binds only to `http://127.0.0.1:8765`. It does not accept a user-supplied provider URL, redirect failed inference to a cloud model, or call an alternative OpenAI-compatible inference server.

The local integration supports:

- Discovering installed local models via Ollama’s `/api/tags` endpoint.
- Assigning a **separate installed model to each agent role**.
- Running successive text-chat stages via `/api/chat`.
- Explicit, confirmed model downloads using the Lab’s **Add Model · Ollama** UI.
- Best-effort model unloading between completed stages, without discarding saved results if unloading fails.
- A small starter model, `qwen2.5:0.5b`, when the user approves the initial download.

For example, a Tutor may use an installed Qwen model while an Evaluator uses an installed Gemma model. **Qwen, Gemma and Llama are examples, not bundled guarantees**: selection is restricted to models actually reported as installed by Ollama. Downloading an Ollama model **does not** train its weights or create a Transformers-compatible fine-tuning directory.

**Fully local Ollama operation requires an additional Ollama setting:** preserve existing fields in `%USERPROFILE%\.ollama\server.json` and set `"disable_ollama_cloud": true`, then restart Ollama. Alternatively configure `OLLAMA_NO_CLOUD=1` in the Ollama **process** environment. A loopback API address alone is not proof that all optional Ollama cloud features are disabled.

Source: [Ollama adapter](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/apps/local-ai-agents-lab/providers.py) and [local application README](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/apps/local-ai-agents-lab/README.md).

## 4. Five workspaces and fifteen agent roles

Each active workspace maintains its own history and supports independent installed-Ollama-model assignments for its roles. The roles execute in a defined **sequential** order.

| Workspace | Purpose | Agent sequence |
| --- | --- | --- |
| **Conference Room** | Collaboration & Problem Solving | Strategist → Analyst → Engineer |
| **Training Lab** | Learning & Improvement | Tutor → Student → Evaluator → Improver |
| **Evaluation Lab** | Assessment & Benchmarking | Assessor → Scorer → Benchmarker |
| **Advisory Lab** | Analysis & Recommendations | Analyst → Advisor |
| **Optimization Lab** | Performance & Optimization | Diagnostician → Optimizer → Validator |

The **Training Lab** saves completed stages as a traceable feedback cycle. Its “learning” means improving a response **within the session through prompts and feedback**; it does **not** change model weights. The Evaluation Lab can also assess a previously completed Training session using a separately selected local evaluation model, saving qualified results without overwriting the original training record.

Agent scores and suggestions are **model-produced assessments**, not independent scientific measurements or certification. These agents do not execute shell commands, read arbitrary files or repositories, edit code, provision infrastructure, or make real-world operational changes.

The **Automatic Exercise Engine** is **Unavailable — Under Construction**. No active exercise or dataset catalogue is bundled; manual Training topics remain available. Automatic runs and model-weight fine-tuning should not be represented as active training services.

Source: [Detailed App Description](./app-description.html), [five-Lab release scope](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/docs/product/RELEASE_SCOPE.md).

## 5. SQLite: local persistence and privacy

The built-in **SQLite** file `data/campus.sqlite3` holds workspace histories, completed stage results, applicable evaluation records and the **separate** history of explicitly completed ChatGPT Advisor questions/answers. SQLite requires no separate database server.

The database is **not encrypted by the Lab itself**. Anyone with sufficient access to the same Windows user account or device may be able to read it. Use Windows device encryption or BitLocker when protection at rest is necessary. Stop the Lab before backing up or moving this database; do **not** publish `data/` or personal tokens to GitHub.

## 6. Optional external integrations

These connections are **not** replacements for the local Ollama engine used by the fifteen agent roles.

### ChatGPT Advisor — optional external question

The Connections area can initiate a browser-mediated **Connect with ChatGPT** sign-in. The application accepts **no OpenAI API key** for this flow. With separate approval, the Lab installs the pinned identity-verification component `PyJWT[crypto]==2.10.1` into a dedicated virtual environment; Windows DPAPI protects the local connection record for the current Windows user.

Once the signed-in account is eligible and the connection is working, an **explicit Ask** sends **one user-entered question** to the external Advisor and displays the result. The current implementation selects the first visible model in the account-specific model catalogue internally; there is no manual Advisor model picker. Local workspaces are **not automatically read, attached or synchronised**. Only submitted Advisor Q&A is stored in its own local history, and the user can explicitly clear it. The response request uses `store: false`.

Account eligibility and usage limits are determined by OpenAI; an eligible paid ChatGPT subscription may be required. Local Ollama-powered workspaces do **not** require a ChatGPT subscription. **Automated and mocked implementation tests are not proof of a successful live account connection.**

Source: [ChatGPT integration](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/apps/local-ai-agents-lab/openai_connection.py) and [optional dependency](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/apps/local-ai-agents-lab/openai-connection-requirements.txt).

### RunPod — optional read-only provider check

A user may set up a **personal** RunPod spending/time plan, optionally save a RunPod access token protected by **Windows DPAPI**, and explicitly request a **read-only** account/GPU availability and price check. The fixed endpoint is `https://api.runpod.io/graphql`.

The Lab **cannot** create or start a GPU Pod, upload training data, launch a chargeable job, enforce a spending cap or convert quoted USD prices to EUR. Personal budget figures are **planning information**, not provider-side financial controls. A live RunPod check remains separately verifiable; local mocked tests do not prove production availability.

Source: [RunPod read-only adapter](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/apps/local-ai-agents-lab/runpod_readonly.py) and [personal provider plan](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/apps/local-ai-agents-lab/personal_provider.py).

## 7. Advanced fine-tuning stack — installed only on explicit advanced setup

The repository retains an **isolated training environment** for possible supervised **LoRA** adapter fine-tuning. This is technically separate from regular agent conversations and **is not operational in the released Local Lab**. The normal Easy Start does not install the training packages, CUDA, model-training datasets or drivers.

The training-only requirements are pinned:

| Library | Required version | Intended function |
| --- | --- | --- |
| PyTorch (`torch`) | **2.7.1** | Neural-network computation |
| Hugging Face Transformers | **4.53.0** | Model loading and training interfaces |
| PEFT | **0.15.2** | Parameter-efficient LoRA adapters |
| TRL | **0.19.1** | Supervised fine-tuning workflow |
| Accelerate | **1.8.1** | Training device/runtime coordination |
| Datasets | **3.6.0** | Training dataset handling |

The optional training setup script accepts **Python 3.11 or 3.12** and prepares `training/.venv`, with CPU or compatible NVIDIA CUDA selection. It does not install NVIDIA drivers or automatically choose CUDA packages. Training input requires a separate locally compatible model directory and valid **JSONL** dataset; an Ollama-downloaded model is not automatically usable for this purpose.

**Important release limitation:** the training-job endpoint remains **locked**. Neither local LoRA execution nor remote RunPod fine-tuning is enabled in this release. The retained developer worker and readiness checks are not a promise of a supported training service.

Sources: [pinned requirements](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/apps/local-ai-agents-lab/training/requirements.txt), [training setup script](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/apps/local-ai-agents-lab/scripts/setup-training.ps1), [acceptance criteria](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/docs/requirements/ACCEPTANCE_CRITERIA.md).

## 8. Unsupported inference providers

The released Lab does **not** implement agent-inference adapters for **LM Studio, Jan, vLLM, a separate llama.cpp server, Google Gemini API or Anthropic Claude API**. Some products may expose HTTP or OpenAI-compatible endpoints, but endpoint similarity is **not** an approved integration. A user cannot switch the Lab’s fixed Ollama URL to one of these providers through the UI.

Likewise, the optional **ChatGPT Advisor** is a separate, user-triggered external question feature — **not** an inference adapter available for the local roles. The optional **RunPod** link is read-only provider planning — **not** cloud agent inference or a training execution engine.

## 9. System requirements and setup

| Item | Requirement / guidance |
| --- | --- |
| Host | **Windows PC**, official Windows ZIP release |
| Runtime | Compatible Python **3.9+** for core Lab; Easy Start offers **Python 3.12** |
| AI inference | Installed and running **Ollama**; at least one local compatible text model |
| Starter model | `qwen2.5:0.5b` offered after explicit user approval |
| Disk space | At least **3 GiB free** for initial Easy Start; larger models may require many more GiB |
| Internet | Required for missing prerequisite/model downloads and optional external connections; not required for offline local inference after setup |
| Browser | Modern browser on the same PC, reaching `http://127.0.0.1:8765/` |
| GPU | **Not required** for basic operation; CPU inference may be slow; capacity depends on chosen model |
| Optional fine-tuning setup | Python **3.11/3.12**, dedicated dependencies and additional disk/GPU checks; **training remains locked** |

### Quick Start (Windows)

1. Download the verified Windows ZIP from the [landing page](https://ai-lab.markellosecosystem.com/). New packages include the version in the filename (for example, `AI-Agents-Lab-Windows-vX.Y.Z.zip`); older assets retain their existing names.
2. Extract it into a new folder on the Windows computer (do not run a BAT file from within the ZIP).
3. Start `Start AI Training Lab.bat` and approve each missing prerequisite or initial model download separately.
4. Once ready, open `http://127.0.0.1:8765/` and choose an installed Ollama model.
5. For upgrades, stop the old server first and back up `data/campus.sqlite3` before transferring history to the new extracted folder.

### Understanding the two Windows .bat files

- **`Start AI Training Lab.bat`:** The single normal launcher with readiness checks and an optional first-run Desktop shortcut choice.
- **`setup-training-environment.bat`:** Separate advanced training-dependency setup; **not** needed to start the Lab and **does not unlock fine-tuning**.

## 10. Development, deployment and release boundaries

**Node.js** supports landing-page builds, validation and ZIP packaging; it is **not** a runtime dependency of a person opening the official Windows ZIP. **GitHub and GitHub Actions** manage the source and release verification. **Cloudflare Pages** hosts the static public guide and **Cloudflare R2** stores reviewed milestone ZIPs. GitHub releases have their **own independently verified versions and SHA-256 digests** and must not be conflated with the previous STABLE R2 milestone. STABLE is an owner-approved release designation, not a guarantee that no defects remain.

The public site is built into `apps/ai-lab-landing/dist`. The **Technical README you are reading** is generated from `apps/ai-lab-landing/src/PUBLIC_DOCUMENTATION.md` during that build; update the **source document**, not the generated `dist/README.md`.

**Manual update checking inside the Local App: not implemented.** Releases must be reviewed and installed manually, preserving local data. The public page displays the owner-approved STABLE v2.0.26 and BETA v2.0.27 GitHub releases; the previous STABLE v2.0.16 R2 milestone remains available in the archive. The GitHub and R2 ZIPs are independently verified, not interchangeable version-matched fallback assets. BETA is a testing designation, not a recommendation to replace STABLE automatically.

## 11. Verification status and current limitations

- The source and automated tests describe **Ollama-only** local routing, the five-Lab architecture, protected optional connections and local persistence.
- **Live ChatGPT sign-in/Advisor** and **live RunPod account/GPU queries** should be verified on an authorized account before claiming end-to-end readiness.
- An **Automatic Exercise Engine** is not provided; the existing manual Training workflow remains available.
- **Model-weight fine-tuning, remote GPU training, alternative inference providers, autonomous tool execution and automatic updates** are unavailable.
- The Lab is an **experimental environment**. Model-generated evaluation scores should not be treated as independently validated performance benchmarks.
- Documentation describes the checked **repository source**; actual locally installed ZIP versions and user configuration may differ.

### Source references

- [Local Lab README and current functionality](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/apps/local-ai-agents-lab/README.md)
- [Public landing-page build and source](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/tree/main/apps/ai-lab-landing)
- [Released scope](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/docs/product/RELEASE_SCOPE.md)
- [Acceptance and verification records](https://github.com/mmark76/Markellos-Ecosystem-AI-Agents-Lab/blob/main/docs/requirements/ACCEPTANCE_CRITERIA.md)

*Documentation snapshot: 21 October 2026. Update technical claims and checks as features become verified and released.*
