# System Architecture

## 1. Context
- System purpose:
- Users and actors:
- External systems:
- System boundary:
- Trust boundaries:

## 2. Architecture Drivers
- Key functional drivers:
- Security drivers:
- Availability:
- Performance:
- Scalability:
- Maintainability:
- Accessibility:
- Cost:
- Compliance:

## 3. Chosen Architecture
- Style:
- Rationale:
- Alternatives rejected:
- Known trade-offs:

## 4. Modules and Ownership

| Module | Responsibility | Public interface | Data owned | Dependencies | Owner |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## 5. Dependency Direction
Document allowed and forbidden dependencies.

## 6. Data Flow
Document sensitive and critical data flows.

## 7. Deployment
- Environments:
- Network zones:
- Compute:
- Database:
- Storage:
- Edge / CDN / WAF:
- Secrets:
- Observability:

## 8. Failure and Recovery
- Failure modes:
- Graceful degradation:
- Retry rules:
- Idempotency:
- Rollback:
- Backup and restore:

## 9. Architecture Health Checks
List automated or manual checks enforcing invariants.

## Canonical Dashboard Reference Architecture

- Style: repository-root static HTML/CSS/vanilla JavaScript.
- Presentation: `index.html` and `dashboard.css`.
- Shell behavior and pure formatting/validation rules: `dashboard.js`.
- Platform-neutral design source: `design-system/tokens/tokens.json` with the
  maintained `tokens.css` adapter.
- Persistence: one optional browser-local appearance record; no server data.
- External boundary: the explicit ecosystem-return HTTPS link only.
- Dependencies, backend, authentication, analytics, remote fonts, and
  third-party scripts: none.

Browser storage is untrusted infrastructure input. `dashboard.js` validates and
normalizes it before the presentation layer applies bounded data attributes and
CSS custom properties. All dynamic text uses `textContent`; no HTML string is
inserted into the DOM.
