# Change Record: Public BETA distribution for v0.1.24

- Change ID: `AI-LAB-CHG-008`
- Requested and approved by: Repository maintainer, 2026-10-13
- Classification: `RELEASE DISTRIBUTION / SECURITY-REVIEWED INFRASTRUCTURE CHANGE`
- Affected objectives: `AI-LAB-OBJ-001`, `AI-LAB-OBJ-003`, `AI-LAB-OBJ-005`
- Decision: Keep `mmark76/Markellos-Ecosystem-AI-Agents-Lab` private. Distribute only the already published `AI-Agents-Lab-Windows.zip` through the isolated `ai-agents-lab-public-beta` Cloudflare R2 bucket and its Cloudflare-managed `r2.dev` public URL. No DNS change, Worker binding, Local App change, or ZIP rebuild is part of this change.
- Artifact identity: `v0.1.24`, `AI-Agents-Lab-Windows.zip`, SHA-256 `3a791b964584d00994a737b0d84796f122fe47c3f911a3045d6bdccd1ad47db1`.
- Publication controls: Versioned immutable R2 object key, attachment download disposition, `application/zip` content type, immutable cache header, published checksum companion file, and a landing build that rejects a malformed distribution URL, digest, or release-version mismatch.
- Transparency: The public dashboard keeps its BETA badge and truthful feature-status cards, replaces the private-GitHub access warning only after anonymous R2 verification, and displays the checksum.
- Verification required: Anonymous HTTP GET of the public R2 object, downloaded-file SHA-256 comparison, private GitHub visibility check, landing build regression, production Pages deployment, and anonymous live-dashboard check.
