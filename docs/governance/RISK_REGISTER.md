# Risk Register

| Risk ID | Description | Category | Likelihood | Impact | Treatment | Owner | Residual risk | Status |
|---|---|---|---|---|---|---|---|---|
| AI-LAB-RISK-001 | A visitor may mistake the public guide for a hosted AI service and disclose information. | Privacy / product | Medium | Medium | Keep local-only wording prominent; provide no forms, chat, accounts, or API endpoint. | Repository maintainer | Low | ACTIVE |
| AI-LAB-RISK-002 | Local SQLite conversation history may be readable by someone with device or Windows-account access. | Privacy / local security | Medium | Medium | Keep data local, exclude it from Git, and document device encryption and account protections. | Repository maintainer | Medium | ACTIVE |
| AI-LAB-RISK-003 | A Pages configuration error could publish unrelated repository content or weaken the public/local boundary. | Deployment / security | Low | High | Publish only the reviewed landing artifact; verify preview, headers, routes, and rollback path. | Repository maintainer | Low | ACTIVE |
| AI-LAB-RISK-004 | A local inference provider may not be running or may expose no compatible model. | Local availability | Medium | Low | Check the selected fixed endpoint on demand, show its status, and leave the other providers unaffected. | Repository maintainer | Low | ACTIVE |
| AI-LAB-RISK-005 | Local fine-tuning can require substantial memory or elapsed time. | Local compute | Medium | Medium | Explicit start confirmation, single-job guard, CPU option, CUDA preflight, retained failure status, and documented hardware guidance. | Repository maintainer | Medium | ACTIVE |
