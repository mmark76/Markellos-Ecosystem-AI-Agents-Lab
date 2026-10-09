# Release and rollback procedure

This is an application-owned procedure to adapt under that app's change controls.

1. Select an exact reviewed source commit. Require clean tracked build inputs,
   including the generator, and an explicit runtime file allowlist. Exclude Git,
   evidence, operator docs, credentials and unused source.
2. Build reproducibly where possible. Record version, full source SHA and files
   with byte sizes/SHA-256 in deployment-manifest.json. Hash the manifest and
   retain that digest in trusted build/review evidence separately from the release.
   A self-declared source SHA is not a cryptographic source attestation.
3. Resolve IMAGE_REFERENCE to an approved publisher/platform digest and review
   current vulnerabilities. The static profile blocks unresolved Critical/High
   findings. Never substitute a floating tag at deployment.
4. Stage a new immutable RELEASE_PATH and verify manifest digest and complete
   contents before and after transfer using the reviewed
   [artifact verifier](../../../checks/strong-room/verify-runtime-artifact.cjs).
   Use the resolved release directory, not its current symlink.
5. Render and validate application-owned Compose/NGINX/Tunnel configuration.
   Preserve previous release, configuration and image. Start only the authorized
   app service; verify effective mounts, process hardening, host health and
   loopback isolation. Do not install a verification runtime silently.
6. Verify restrictive saved Access/MFA, then publish only the scoped Tunnel/DNS
   delta. Preserve unrelated resources and compare pre/post state.
7. Execute all [acceptance gates](../../../standards/private-app-security-baseline/acceptance-criteria.md).
   Verify the actual running mount path and compare served files to the trusted
   artifact. File hashes alone do not prove what a process serves.
8. Record the accepted source, runtime image, configuration revision, release
   path, manifest digest and evidence in the application repository.

Manifest shape (placeholders are intentionally not runnable):

```json
{
  "schema_version": "1.0.0",
  "artifact": "<APP_NAME>",
  "application_version": "<APP_VERSION>",
  "source_git_sha": "<SOURCE_GIT_SHA>",
  "files": [
    {"path": "index.html", "bytes": 0, "sha256": "<FILE_SHA256>"}
  ]
}
```

FILE_SHA256 is computed from each generated file, and bytes is its actual size.
The manifest excludes itself from files; its independent digest anchors trust.
The verifier rejects symlinks, unsafe paths, missing/extra files, duplicate
entries, size/hash changes and mismatched expected source/app/version.

## Rollback

On health, integrity, access or bypass failure, stop acceptance and invoke the
app's reviewed rollback. First restore a fail-closed exposure state, preserving
restrictive Access; then select the independently verified PREVIOUS_RELEASE_PATH,
its image and configuration. Recreate only the affected container so its bind
mount resolves to the intended immutable path. Reverify mounts, hashes, health,
Access and unrelated services. First deployment rolls back to unpublished.

Changing a current symlink does not reliably change an existing container bind
mount. Do not overwrite old releases in place. Preserve failure evidence and
retain previous artifacts until the application's retention/recovery policy permits
cleanup. Do not overwrite whole shared route lists or undo another actor's changes.
