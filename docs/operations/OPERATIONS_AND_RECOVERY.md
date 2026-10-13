# Operations and Recovery

## Ownership

The repository maintainer owns local installation guidance, public landing-page configuration, release verification, security review, and recovery decisions.

## Local Lab

- Run only on an owner-controlled Windows device and loopback interface.
- Stop the server before copying, restoring, or deleting the SQLite database.
- Preserve `data/` during a package upgrade; it is excluded from Git and release artifacts.
- Roll back by restoring the previous verified local package and local data backup.
- Easy Start must be launched from the extracted official ZIP. It checks first and requests an explicit approval separately for every install, local service start, and initial-model download. If setup fails or is declined, it makes no further change; correct the displayed prerequisite and run it again.

## Public landing page

- Build only `apps/ai-lab-landing/dist` for Cloudflare Pages.
- Use preview deployment and static-artifact checks before an approved production deployment.
- Roll back through Cloudflare Pages deployment history.
- The public site has no application logs, database, account, analytics, or local-Lab route.

## Incident response

If a public artifact, hostname, or header configuration violates the local-only boundary, remove or roll back the affected Pages deployment, preserve sanitized evidence, and reassess the threat model before redeployment. If local Lab data is exposed on a device, stop the Lab, protect the device/account, and handle the SQLite file as private local data.
