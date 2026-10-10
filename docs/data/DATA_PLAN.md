# Data Plan

| Data ID | Data | Purpose | Location | Classification | Retention and deletion | Access |
|---|---|---|---|---|---|---|
| AI-LAB-DATA-001 | Local conversation history | Preserve learning and conference-room sessions. | Local SQLite database under the Lab data directory. | Private local device data. | Owner-controlled; stop the server before backup, export, or deletion. | The Windows user with access to the device. |
| AI-LAB-DATA-002 | Static public guide | Explain installation and the public/local boundary. | Cloudflare Pages static artifact. | Public. | Replaced by each approved deployment; recover through Pages rollback and Git history. | Public read-only access. |

The public landing page collects no visitor data. The repository must not contain the local SQLite database, model files, credentials, or local logs. Local Lab data is not encrypted by the application; device encryption and Windows account protection are owner-controlled protections at rest.
