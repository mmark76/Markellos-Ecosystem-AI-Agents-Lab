# Health

HEALTH_ENDPOINT returns minimal non-sensitive health information. In the static
profile GET/HEAD return 200 and other methods return 405. The container-local
healthcheck and host-local check must both pass; they exercise different paths.

Use the reviewed origin with the real APP_HOSTNAME Host header. Check root,
representative assets, private data and unknown paths as well as health. Confirm
expected security headers, no-store behavior and served artifact hashes.

Production health is checked through the authenticated Access path. An anonymous
Access redirect proves neither origin health nor authenticated application health.
Do not create an anonymous health bypass just to satisfy a monitor.

For dynamic applications, define liveness/readiness separately and keep internal
dependency details out of responses. Monitoring credentials and logged responses
need a separate design; they do not belong in this template.
