# Operations and Recovery

## Ownership

The repository maintainer owns local installation guidance, public landing-page configuration, release verification, security review, and recovery decisions.

## Local Lab

- Run only on an owner-controlled Windows device and loopback interface.
- Stop the server before copying, restoring, or deleting the SQLite database.
- Preserve `data/` during a package upgrade; it is excluded from Git and release artifacts.
- Roll back by restoring the previous verified local package and local data backup.
- Easy Start must be launched from the extracted official ZIP. It checks first and requests an explicit approval separately for every install, local service start, and initial-model download. If setup fails or is declined, it makes no further change; correct the displayed prerequisite and run it again.
- An optional personal-provider token is protected only for the current Windows user under Local App Data. Do not copy, back up, export, or sync the encrypted blob; it is intentionally not portable. Use the Local Lab's explicit removal control before transferring, servicing, or retiring the device. If the Windows account or device is suspected to be compromised, remove/revoke the token through the provider account and remove the local blob; the Lab does not contact the provider on its own.
- The RunPod connection check is read-only and user-initiated. It shows only a temporary GPU catalog snapshot; it never starts or stops a provider resource. If its result looks wrong or the provider rejects the token, remove the local blob and review/revoke the token in the RunPod console before saving a replacement.

## Public landing page

- Build only `apps/ai-lab-landing/dist` for Cloudflare Pages.
- Use preview deployment and static-artifact checks before an approved production deployment.
- Roll back through Cloudflare Pages deployment history.
- The public site has no application logs, database, account, analytics, or local-Lab route.

## Incident response

If a public artifact, hostname, or header configuration violates the local-only boundary, remove or roll back the affected Pages deployment, preserve sanitized evidence, and reassess the threat model before redeployment. If local Lab data is exposed on a device, stop the Lab, protect the device/account, and handle the SQLite file as private local data.
