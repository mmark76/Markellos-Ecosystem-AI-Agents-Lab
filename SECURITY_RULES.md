# Security Adoption and Verification

## Status and authority

[Ecosystem Security — The Shield](https://github.com/mmark76/Ecosystem-Security-The-Shield) is authoritative for ecosystem security standards, requirements, controls, IAM, secrets, trust boundaries, threat modelling, secure deployment requirements, security verification, incident response, and security governance.

This DNA document defines how a project adopts, traces, verifies, evidences, and completes applicable Shield requirements. It is not a security standard or control catalogue and does not supersede The Shield.

[Strong Room](https://github.com/mmark76/Ecosystem-Security-The-Shield/tree/main/standards/private-app-security-baseline) is a concrete, versioned Shield pattern for appropriate private applications. It is selected only when applicable; it is not a universal project architecture or an Engineering Standards requirement.

## Relationship to Engineering Standards

`ENG-SEC-001` in [Ecosystem Engineering Standards](https://github.com/mmark76/Ecosystem-Engineering-Standards/blob/main/ENGINEERING-REQUIREMENTS.md#eng-sec-001--applicable-shield-requirements) requires systems to satisfy applicable Shield requirements without reproducing them. The DNA supplies the project process and evidence chain for doing so.

## Security adoption workflow

For each project or material change:

1. Identify the Shield standards, requirement IDs, control baselines, and accepted revisions applicable to the project's scope and risk.
2. Record the system risk profile, assets, data, actors, entry points, trust boundaries, abuse cases, and project-specific threats in `docs/security/`.
3. Map each applicable Shield requirement to project-owned controls, responsible owners, verification methods, and sanitized evidence.
4. Keep implementation-specific configuration, identities, authorization rules, deployment details, and operational evidence in the adopting project or another approved protected location.
5. Record inapplicable requirements and exceptions with their rationale, risk, compensating controls, owner, approval, and review or expiry condition under the governing Shield and project process.
6. Run the relevant security checks and `checklists/SECURITY_GATE.md` before the applicable release or completion decision.
7. Reassess applicability when architecture, data, identity, exposure, dependencies, deployment, or risk materially changes.

## Project records

The DNA templates provide locations for project-specific adoption records:

- `docs/security/SECURITY_PLAN.md` for requirement/control mappings and ownership;
- `docs/security/THREAT_MODEL.md` for the project threat model;
- `docs/governance/RISK_REGISTER.md` for visible project risk;
- `docs/governance/EXCEPTIONS.md` for approved deviations;
- `docs/requirements/TRACEABILITY_MATRIX.md` for implementation and evidence links;
- `checklists/SECURITY_GATE.md` for the project verification decision;
- `docs/operations/OPERATIONS_AND_RECOVERY.md` for project-owned operational and recovery procedures.

These records operationalize authoritative Shield requirements. Blank templates, checklist completion, or a selected pattern do not by themselves demonstrate security.

## Ownership boundary

- The Shield owns shared security requirements, controls, baselines, and security governance.
- Strong Room remains a Shield-owned implementation pattern.
- The DNA owns the adoption, traceability, gate, evidence, and completion method.
- Each project owns its concrete implementation, configuration, threat model, authorization rules, exceptions, and deployment evidence.
- Infrastructure, Core, Intelligence, and Control retain their domain responsibilities.

Where DNA and Shield wording appears to conflict, the applicable Shield requirement is authoritative and the conflict is recorded for resolution rather than silently interpreted.
