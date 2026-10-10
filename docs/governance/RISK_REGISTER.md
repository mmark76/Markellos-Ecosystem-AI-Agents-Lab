# Risk Register

| Risk ID | Description | Category | Likelihood | Impact | Treatment | Owner | Residual risk | Status |
|---|---|---|---|---|---|---|---|---|
| AI-LAB-RISK-001 | A visitor may mistake the public guide for a hosted AI service and disclose information. | Privacy / product | Medium | Medium | Keep local-only wording prominent; provide no forms, chat, accounts, or API endpoint. | Repository maintainer | Low | ACTIVE |
| AI-LAB-RISK-002 | Local SQLite conversation history may be readable by someone with device or Windows-account access. | Privacy / local security | Medium | Medium | Keep data local, exclude it from Git, and document device encryption and account protections. | Repository maintainer | Medium | ACTIVE |
| AI-LAB-RISK-003 | A Pages configuration error could publish unrelated repository content or weaken the public/local boundary. | Deployment / security | Low | High | Publish only the reviewed landing artifact; verify preview, headers, routes, and rollback path. | Repository maintainer | Low | ACTIVE |
