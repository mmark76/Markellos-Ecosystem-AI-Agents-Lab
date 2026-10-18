# Educational Resource Library — AI Training Lab

Status: curated, reference-only learning material (2026-10-18).  
Scope: **five existing Labs / fifteen existing AI Agent roles remain unchanged**.

## Purpose and boundaries

This is an educational index of third-party **prompt libraries**, **training datasets**, and **evaluation/benchmarking tools**. It is **not** a runtime prompt registry, plugin, embedded dataset, model-training feature, live benchmark integration, or an approved third-party code dependency.

- Source links point to the original publishers. No external prompt or dataset is copied into this repository.
- Nothing is installed, downloaded, executed, synchronized, or loaded by the Local Lab as a result of these documents.
- The existing fifteen UTF-8 agent system prompts under [the local application's `prompts/` folder](../../apps/local-ai-agents-lab/prompts/) remain authoritative and unchanged.
- The five Lab workflows, fixed-loopback Ollama inference, local SQLite history, and current service boundaries remain unchanged. The two Markdown guides are bundled as inert reference documents in Windows ZIP releases; they are never loaded or executed by any Agent.
- Always inspect dataset cards, provenance, current usage rights, individual examples, privacy implications, and licensing **before** local reuse or redistribution.
- Do not submit secrets, personal data, copyrighted material without permission, or operationally sensitive records to unreviewed third-party services.
- In-session exercises and feedback **do not update model weights**. Real fine-tuning is a separate process, not enabled by adding a resource link.

## A. Prompt libraries

| Resource / official source | What it contains | Suggested Lab use | Before use |
|---|---|---|---|
| [prompts.chat — formerly Awesome ChatGPT Prompts](https://github.com/f/prompts.chat) | Community prompt examples for roles, tasks and writing styles | Conference Room; Advisory Lab; Training Lab exercise inspiration | Review the *specific* prompt for quality and safety. Project states prompt content/data are CC0, while its source code has MIT terms; check current notices. |
| [BigScience PromptSource / P3](https://github.com/bigscience-workshop/promptsource) | Structured templates mapping dataset examples into natural-language inputs and expected outputs | Training Lab; Evaluation Lab task-design reference | Templates depend on dataset schemas and underlying dataset rights. Legacy tooling requirements may not suit the current Lab; no installation is implied. |

**Important:** The external examples are *task material*, not replacements for the fifteen role-specific system prompts. Select and adapt exercises manually.

## B. Training datasets

| Resource / dataset card | What it contains | Suggested Lab use | Before use |
|---|---|---|---|
| [Databricks Dolly 15k](https://huggingface.co/datasets/databricks/databricks-dolly-15k) | ~15,000 instruction/response examples across classification, summarization, extraction and other tasks | Training Lab text exercises; human-reviewed reference answers | The dataset card identifies **CC BY-SA 3.0**, with attribution/share-alike obligations. Entries can contain mistakes or third-party Wikipedia excerpts. |
| [HuggingFaceH4 UltraChat 200k](https://huggingface.co/datasets/HuggingFaceH4/ultrachat_200k) | Multi-turn conversational examples and training splits | Training Lab dialogue exercises; Advisory Lab conversation study | The dataset card lists **MIT**. Review provenance and possible synthetic errors; keep training/test subsets separate. |

**Important:** Cataloging datasets does **not** download them, import them into the application, or start supervised fine-tuning. Evaluate suitability of the particular sample before manually using it.

## C. Evaluation and benchmarking

| Resource / official source | What it supplies | Suggested Lab use | Compatibility note |
|---|---|---|---|
| [EleutherAI LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness) | Standardized language-model evaluation tasks and metrics | Evaluation Lab; Benchmarker reference for test design and reporting | External framework; **not integrated** into our Evaluation Lab. Its scores are not interchangeable with our internal agent assessments. |
| [Promptfoo](https://github.com/promptfoo/promptfoo) | Prompt tests, assertions, comparisons and red-teaming workflows | Evaluation Lab; Optimization Lab testing methodology | External CLI; **not installed** or invoked by the Lab. Provider setup may introduce keys or network use; review independently. |
| [Sierra Research τ³-bench (tau2-bench repository)](https://github.com/sierra-research/tau2-bench) | Simulated user–agent–tool scenarios and task-success evaluation | Conference Room and Evaluation Lab: future agentic evaluation reference | Current local agents have **no tool-execution interface**; this benchmark is conceptual reference, **not a runnable native Lab task**. Pin benchmark release/task version before comparison. |

### Caution about evaluation claims

- Use a fixed task set, model, prompt version, decoding settings, grader rubric and baseline when comparing runs.
- Keep test data separate from examples used for training, tuning or prompt optimization to avoid contamination.
- Report uncertainty, missing data, and model-generated judgments clearly. A model score is not independent proof of real-world capability.
- Published benchmark scores may be incomparable after benchmark corrections or version changes (particularly relevant to τ³-bench task revisions).

## Fit to our five existing Labs

| Lab | Existing roles / flow | Educational materials to use |
|---|---|---|
| **Conference Room — Collaboration & Problem Solving** | Strategist → Analyst → Engineer | Adapt task scenarios from prompts.chat; use τ³-bench only to discuss simulated-agent design. |
| **Training Lab — Learning & Improvement** | Tutor → Student → Evaluator → Improver | Select a **human-reviewed** task from PromptSource or Dolly; use UltraChat for dialogue-format exercises. |
| **Evaluation Lab — Assessment & Benchmarking** | Assessor → Scorer → Benchmarker | Borrow rubric and reproducibility practices from Promptfoo and LM Evaluation Harness; keep results qualified. |
| **Advisory Lab — Analysis & Recommendations** | Analyst → Advisor | Use role-based prompt examples as hypothetical advisory cases, not external instructions that overrule role boundaries. |
| **Optimization Lab — Performance & Optimization** | Diagnostician → Optimizer → Validator | Compare a manually established before/after prompt workflow with consistent criteria; use Promptfoo as a methodology reference only. |

## Manual workflow (no integration or downloads)

1. Choose a learning objective and a trusted resource, and examine its source rights and limitations.
2. Copy or **adapt only permissible, non-sensitive text** into the relevant Lab's normal user input. Retain the existing role system prompts.
3. Run the existing local Agent sequence. Do not presume an external benchmark suite is running inside the Lab.
4. Record the task text, model names and versions, prompt version, available settings, expected evidence, and outcome manually.
5. Evaluate against explicit criteria; repeat under comparable conditions before claiming improvement.

Start with [five original, copy-ready text-only exercises](STARTER_EXERCISES.md) that require no third-party download. They are locally authored examples; they are **not** samples copied from the third-party catalogs.

## Maintenance

The reference links and upstream terms were checked for this initial catalog on **2026-10-18**. Upstream repositories and dataset cards can change: verify licenses, access requirements, compatibility and benchmark versions at the original links when actually using a resource. Adding future native dataset import, prompt browsing, tool execution, auto-downloading, fine-tuning, or benchmarking requires a **separate approved design/change**.
