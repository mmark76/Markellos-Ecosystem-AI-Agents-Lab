# Template Deployment Boundary

This repository is a starter, not a production deployment. It has no canonical hostname, hosting account, production environment, or deployment authorization.

Projects created from this template select an infrastructure profile, retain their own deployment configuration, and obtain explicit approval for production-impacting changes. Reusable runtime mechanisms remain owned by [Ecosystem Infrastructure](https://github.com/mmark76/ecosystem-infrastructure); applicable security controls remain owned by The Shield.

The static reference shell may be built for project use with `node scripts/build-site.cjs <reviewed-commit> <new-output-directory>`. Hosting, DNS, credentials, and release authorization are intentionally out of scope for this template.
