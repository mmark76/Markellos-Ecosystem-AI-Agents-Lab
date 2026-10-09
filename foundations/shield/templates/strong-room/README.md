# Strong Room templates

These are reviewable starting points owned by Security. Copy only the chosen
patterns into the adopting application and keep its populated configuration there.
No deploy command or provider API mutation is included.

The static profile combines [Compose](docker/compose.yaml.template),
[NGINX](nginx/nginx.conf.template), [Access](access/README.md),
[Tunnel](tunnel/README.md), [health](health/README.md),
[logout](logout/README.md), and [release procedure](deployment/README.md).

## Parameters

All uppercase angle-bracket tokens are required substitutions, not defaults.
No automatic renderer is supplied: use an application-owned renderer that escapes
values for YAML/NGINX/HTML, rejects unknown/unresolved tokens and validates inputs.
Never run unrestricted envsubst on NGINX: it would erase variables such as $uri.
Values containing newlines, directives or YAML syntax require rejection/encoding.

| Parameter | Meaning / constraint |
| --- | --- |
| APP_NAME | Non-secret application identity and Compose project name; lowercase letters/digits/hyphens |
| APP_HOSTNAME | Exact DNS hostname; no scheme, path or wildcard; e.g. app.example.com |
| LOCAL_BIND_ADDRESS | Supplied profile uses 127.0.0.1; other binding needs a reviewed topology |
| LOCAL_PORT | Unused application-owned host TCP port, 1–65535; e.g. 15080 |
| CONTAINER_PORT | Nonprivileged internal HTTP port, 1024–65535 |
| CONTAINER_NAME | Unique application-owned container name |
| SERVICE_NAME | Application-owned Compose service key |
| NETWORK_NAME | Unique dedicated bridge; no unrelated peers or shared proxy network |
| ACCESS_APPLICATION_ID | Provider-side application metadata, e.g. <ACCESS_APPLICATION_ID> |
| ACCESS_POLICY_ID | Provider-side policy metadata, e.g. <ACCESS_POLICY_ID> |
| ACCESS_TEAM_NAME | Cloudflare Access team subdomain identifier |
| ACCESS_AUD | Exactly this app's allowed JWT audience; never another app's audience |
| AUTHORIZED_IDENTITIES | Exact approved identity selectors, retained by the app/provider; never an Everyone default |
| TUNNEL_ID | Intended existing connector/tunnel metadata; not credentials |
| HEALTH_ENDPOINT | Minimal absolute path, e.g. /healthz; no query, fragment or sensitive details |
| RELEASE_PATH | Absolute resolved immutable release directory; no mutable current symlink passed to verifier |
| PREVIOUS_RELEASE_PATH | Previously verified release directory for rollback; first release records none |
| IMAGE_REFERENCE | Approved static-server image with exact @sha256 digest; no live or floating default |
| RUN_UID / RUN_GID | Verified numeric non-root image user/group |
| SOURCE_GIT_SHA | Full reviewed source commit SHA |
| MANIFEST_SHA256 | Digest retained independently from the release in trusted build/review evidence |
| APP_VERSION | Application-owned version |
| MFA_METHOD / MFA_FREQUENCY | Risk-reviewed independent/IdP factor and challenge frequency; OTP profile uses TOTP each new login |
| ACCESS_SESSION_DURATION | Risk-reviewed session lifetime; no inherited Control lifetime |
| MEMORY_LIMIT / CPU_LIMIT / PIDS_LIMIT | Positive resource budgets tested by the app |
| TMPFS_SIZE | Bounded writable temporary storage, e.g. 16m |

Access fields are a review worksheet, not a credential-bearing API payload.
Tunnel credentials, API tokens, identity codes and recovery secrets have no
template parameters and must never be embedded in rendered output or logs.
Keep generated configs with real values out of this baseline repository.

Run source tests here with `node --test tests/strong-room.test.cjs`.
Validate rendered Compose, NGINX, Tunnel and runtime behavior in the app's
authorized environment before acceptance.
