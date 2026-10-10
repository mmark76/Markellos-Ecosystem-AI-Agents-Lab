# Architecture Decision Records

## AI-LAB-ADR-001 — Separate the public guide from the Local Lab

- Status: Accepted
- Date: 2026-10-09
- Owner: Markellos Ecosystem repository maintainer
- Related requirements: AI-LAB-OBJ-001, AI-LAB-AC-001 through AI-LAB-AC-003

The project needs a public installation guide without exposing the private local application. The selected design uses a static Cloudflare Pages artifact for the guide and retains the Lab as a Windows loopback application.

Consequences: the public artifact has no application API, form, chat input, account, analytics, or user-data processing; the Lab, Ollama, local models, and SQLite database remain outside public routing. A future hosted Lab requires a new approved architecture, security, privacy, and deployment scope.

## AI-LAB-ADR-002 — Use only local Ollama access for the Local Lab

- Status: Accepted
- Date: 2026-10-09
- Owner: Markellos Ecosystem repository maintainer
- Related requirements: AI-LAB-OBJ-001, AI-LAB-SEC-003

The Local Lab communicates only with Ollama on `127.0.0.1:11434`. It does not use cloud AI keys or a provider SDK. Review this decision before adding an external AI provider, public ingress, authentication, telemetry, or data synchronization.
