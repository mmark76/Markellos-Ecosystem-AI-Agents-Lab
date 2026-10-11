# Change Record: Local Inference Providers

- Change ID: `AI-LAB-CHG-004`
- Requested by: Repository maintainer
- Date: 2026-10-11
- Classification: `SCOPE_INCREASE`
- Description: Add selectable fixed-loopback Ollama, LM Studio, and vLLM inference providers to the private Local Lab.
- Reason: Let the same local Lab work with supported local inference engines while preserving its existing rooms, prompts, SQLite history, and browser boundary.
- Affected objective IDs: `AI-LAB-OBJ-004`
- Architecture impact: Introduces an isolated standard-library provider-adapter module; orchestration remains in `server.py`.
- Security and privacy impact: Adds only hard-coded loopback endpoints. Arbitrary URLs, remote inference, credentials, RunPod, and Cloud Core remain out of scope.
- Data impact: None. The existing SQLite schema and records are unchanged.
- Testing impact: Add provider discovery, OpenAI-compatible routing, unavailable-provider, invalid-provider, and existing-flow regression coverage.
- Cost and schedule impact: No cloud cost or deployment action.
- Decision: Approved by direct user request.
- Approved by: Repository maintainer
- Target release: Next Local Lab package release.
