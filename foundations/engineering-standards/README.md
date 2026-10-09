# Ecosystem Engineering Standards

Authoritative, technology-neutral engineering requirements for the Markellos Ecosystem.

## Purpose and authority

This repository defines **what engineering conformity requires** across ecosystem systems and applications. [The Foundation Systems](https://github.com/mmark76/The-Foundation-Systems) assigns that cross-cutting normative responsibility to Ecosystem Engineering Standards.

The requirements are intentionally concise, lifecycle-independent, and limited to engineering outcomes that apply across technologies and domains. The consolidated catalogue is [ENGINEERING-REQUIREMENTS.md](ENGINEERING-REQUIREMENTS.md).

## Normative vocabulary

- **MUST** and **MUST NOT** identify mandatory requirements.
- **SHOULD** and **SHOULD NOT** identify recommended requirements that need an explicit, justified decision when not followed.
- **MAY** identifies a permitted option.

These terms express internal ecosystem requirements. They do not claim compliance with an external certification or standards scheme.

## Scope

Engineering Standards owns:

- lifecycle-independent, technology-neutral engineering requirements;
- cross-cutting architecture, quality, maintainability, compatibility, reliability, testing, documentation, observability, performance, dependency-lifecycle, and technical-debt expectations;
- stable engineering requirement identifiers;
- references to authoritative domain requirements where a cross-cutting obligation depends on another owner.

## Non-responsibilities

Engineering Standards does not own:

- project lifecycle, delivery methodology, templates, checklists, gates, evidence structures, adoption procedures, review processes, or completion rules;
- security standards, security controls, IAM, secrets, threat modelling, security verification, incident response, or security governance;
- Strong Room topology, configuration, templates, checks, or acceptance criteria;
- infrastructure, platform, intelligence, control-plane, or application-specific architecture and implementation;
- populated configuration, production evidence, credentials, secrets, or operational state.

## Relationships

- **[The Foundation Systems](https://github.com/mmark76/The-Foundation-Systems)** owns the ecosystem architecture map and assigns system responsibilities.
- **[The DNA](https://github.com/mmark76/ecosystem-framework)** defines how projects adopt, implement, verify, evidence, and complete applicable Engineering Standards requirements.
- **[The Shield](https://github.com/mmark76/Ecosystem-Security-The-Shield)** is authoritative for security requirements and controls. Engineering Standards references that authority and does not reproduce it.
- **Strong Room** remains a concrete, versioned Shield security pattern for appropriate workloads, not a universal engineering standard.
- **[Infrastructure](https://github.com/mmark76/ecosystem-infrastructure)**, **[Core](https://github.com/mmark76/ecosystem-core)**, **[Intelligence](https://github.com/mmark76/ecosystem-intelligence)**, and **[Control](https://github.com/mmark76/ecosystem-control)** retain their domain architecture and implementation authority.
- Individual applications own their concrete architecture, implementation, configuration, and evidence.

## Requirement identifiers

Requirement identifiers use `ENG-<AREA>-NNN`, for example `ENG-ARCH-001`. Identifiers are stable: wording may be clarified without changing the requirement's meaning, while a materially different obligation receives a new identifier. Removed requirements remain discoverable through repository history and are not silently reassigned.

## Reference and adoption model

```text
The Foundation Systems assigns authority
        ↓
Engineering Standards defines WHAT
        ↓
The DNA defines HOW to adopt, verify and evidence
        ↓
Owning systems and applications implement
```

Projects reference applicable Engineering Standards IDs rather than copying their text. The DNA supplies the adoption, tailoring, exception, traceability, and completion mechanisms. Domain-specific requirements continue to reference their authoritative owner.
