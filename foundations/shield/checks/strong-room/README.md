# Strong Room verification

Three dependency-free Node.js helpers automate bounded predicates. Two manual
procedures cover checks that require privileged evidence, external vantage points
or interactive authentication. This is not a monitoring framework.

Use a supported Node.js runtime (tested with Node 24). Docker helpers require
an explicit Docker context and access to that daemon; inspect the context endpoint
first. Docker access is privileged even when these helpers only inspect.
No commands deploy, change providers, write containers or modify firewall rules.

```text
node checks/strong-room/verify-origin-binding.cjs DOCKER_CONTEXT CONTAINER_NAME LOCAL_PORT CONTAINER_PORT
node checks/strong-room/verify-container-hardening.cjs DOCKER_CONTEXT CONTAINER_NAME NETWORK_NAME IMAGE_REFERENCE UID:GID RELEASE_PATH NGINX_CONFIG_PATH EXPECTED_IMAGE_ID
node checks/strong-room/verify-runtime-artifact.cjs RELEASE_PATH APP_NAME APP_VERSION SOURCE_GIT_SHA MANIFEST_SHA256
```

Replace argument names with app-owned values; quote paths as required by the
shell. EXPECTED_IMAGE_ID is the Docker image ID resolved independently by image
inspection of the approved digest in that daemon's image store. Do not assume it
equals the registry index digest or copy it from the running container being
tested; also verify the selected platform. NGINX_CONFIG_PATH and
RELEASE_PATH are daemon-host paths, not client paths. The artifact verifier runs
where the release files exist.

The Docker helpers inspect current container metadata into memory only. They
never echo raw inspect output (which can contain environment secrets), tokens,
container logs or command errors. Do not save raw Docker inspect as public
evidence. Run artifact verification against a quiescent, immutable release with
trusted directory ownership to avoid concurrent mutation.

Exit/result contract:

- 0 / PASS: only the predicates listed in the returned scope passed.
- 1 / FAIL: an observed mismatch; stop the affected acceptance gate.
- 2 / BLOCKED: invalid invocation, missing files/runtime/permissions, or unusable evidence.
- NOT TESTED and TECHNICALLY UNAVAILABLE are explicit manual-record statuses,
  never silent skips or success exits.

Complete [public-port verification](verify-no-public-port.md) and
[security-boundary verification](verify-security-boundary.md) as well.
Configuration inspection does not prove process UID, kernel capabilities, mount
write-denial, network peer isolation or all external paths. The runtime-artifact
name refers to release files; validate running mount and served bytes separately.

Run local regression tests with `node --test tests/strong-room.test.cjs`.
No validation existed in the target repository before this baseline. Tests use
synthetic inputs and temporary files, not production credentials or endpoints.

The upstream initial validation record is intentionally not imported because it
is dated operational evidence. See the template's
[foundation provenance and exclusion policy](../../../../FOUNDATION_SOURCES.md)
instead.
