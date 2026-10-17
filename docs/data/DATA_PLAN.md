# Data Plan

| Data ID | Data | Purpose | Location | Classification | Retention and deletion | Access |
|---|---|---|---|---|---|---|
| AI-LAB-DATA-001 | Local conversation history | Preserve learning and conference-room sessions. | Local SQLite database under the Lab data directory. | Private local device data. | Owner-controlled; stop the server before backup, export, or deletion. | The Windows user with access to the device. |
| AI-LAB-DATA-002 | Static public guide | Explain installation and the public/local boundary. | Cloudflare Pages static artifact. | Public. | Replaced by each approved deployment; recover through Pages rollback and Git history. | Public read-only access. |
| AI-LAB-DATA-003 | Optional RunPod access token | Prepare a user-owned provider connection without a shared account. | Windows Local App Data credential vault, outside the repository and SQLite. | Private secret, encrypted with current-user Windows DPAPI. | Retained only until explicit in-app removal; do not back up, export, or sync the blob. | The same Windows user on the same device; a future provider adapter still requires separate approval. |

The public landing page collects no visitor data. The repository must not contain the local SQLite database, model files, credentials, or local logs. Local Lab conversation data is not encrypted by the application; device encryption and Windows account protection are owner-controlled protections at rest. The optional AI-LAB-DATA-003 token is the narrow exception: the application protects it with Windows DPAPI, but that does not protect against a compromised process running as the same Windows user.
