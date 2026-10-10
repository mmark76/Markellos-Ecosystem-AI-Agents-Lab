# Engineering Standards Adoption Matrix

The authoritative `ENG-*` catalogue remains [Ecosystem Engineering Standards](https://github.com/mmark76/Ecosystem-Engineering-Standards/blob/main/ENGINEERING-REQUIREMENTS.md). This record maps the applicable requirements to AI Agents Lab.

| ENG ID | Applicability | Project implementation | Verification / evidence | Owner | Status |
|---|---|---|---|---|---|
| ENG-ARCH-001 | Applicable | Public static guide and private loopback Lab are separate modules and trust boundaries. | `docs/architecture/SYSTEM_ARCHITECTURE.md` and source review. | Repository maintainer | IMPLEMENTED |
| ENG-DEP-001 | Applicable | Pages publishes only the landing artifact; local Lab releases are versioned packages. | Component build/verifier commands. | Repository maintainer | IMPLEMENTED |
| ENG-SEC-001 | Applicable | No public API, form, data collection, or third-party script; Lab uses local Ollama only. | Security plan, threat model, artifact and local checks. | Repository maintainer | IMPLEMENTED |
| ENG-TEST-001 | Applicable | Landing and local-Lab builds/tests are defined in the test strategy. | `docs/testing/TEST_STRATEGY.md`. | Repository maintainer | IMPLEMENTED |
| ENG-DOC-001 | Applicable | Scope, architecture, data, operations, risks, and component guides are project-owned records. | Repository documentation review. | Repository maintainer | IMPLEMENTED |
