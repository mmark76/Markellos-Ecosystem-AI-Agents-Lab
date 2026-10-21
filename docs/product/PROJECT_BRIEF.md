# Project Brief

## Identity
- Project name: AI Agents Lab public landing page
- Owner: Markellos Ecosystem repository maintainer
- Product, technical, security, and operations owner: Markellos Ecosystem repository maintainer
- Version: 0.1.0
- Integrated template version: 0.2.0
- Adopted foundation revisions: `FOUNDATION_VERSIONS`

## Problem
People need a safe public entry point that explains how to use the local-only AI Agents Lab without presenting the private, local application as an internet service.

## Users
People who want to install and run the AI Agents Lab on their own Windows device.

## Value
A discoverable, HTTPS-protected guide at `ai-lab.markellosecosystem.com` that clearly separates the public information page from the local Lab runtime.

## Constraints
- Technology: static HTML, CSS, and minimal first-party JavaScript; Cloudflare Pages.
- Privacy: no chat, account, AI API, or Local Lab data collection. The public landing page uses only cookie-less aggregate analytics and an informational notice whose local dismissal does not affect collection.
- Operational: the Lab remains bound to loopback and is never routed through Pages.

## Criticality
- Business criticality: low.
- Safety impact: none.
- Data sensitivity: no application or Local Lab data is processed by the landing page; analytics receives only aggregate UTC hour, domain, and country counts, without download tracking.

## Build / Buy Decision
A small static page is sufficient and avoids changing the local Lab's security and privacy boundary.
