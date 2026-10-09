# Architecture

```text
Internet / browser
  -> Cloudflare Access (exact host, approved identity)
  -> authentication + required MFA
  -> Cloudflare Tunnel
  -> Access JWT validation by cloudflared / trusted gateway
  -> localhost-only published origin on the host
  -> dedicated bridge -> hardened application container
  -> read-only verified release
```

This is a logical security path. In the supplied topology, cloudflared validates
the Access token before forwarding to the host origin. The static NGINX process
does not validate JWTs. Edge authentication and connector-side validation are
distinct controls.

Cloudflared runs on the host (or a separately reviewed topology with access to
that host's loopback). A container's 127.0.0.1 is its own network namespace, not
the host's loopback. The application listens on its container interface; Docker
publishes that port exclusively on host loopback. A container wildcard listener
does not authorize a wildcard host publication.

A dedicated normal bridge with explicit loopback publication is the initial
profile. Control's dated recovery demonstrated missing effective publication
with an internal bridge. Do not assume that `internal: true`, a network's name,
or disabling masquerade proves either reachability or egress denial. Revalidate
the selected engine, effective mappings and host HTTP.

| Owner | Owns |
| --- | --- |
| Security — The Shield | Baseline, reusable templates/checks, detection and alert requirements, governance |
| Application repository | Hostname, ports, service/container names, Access IDs/audience, identity policy, image, release paths, runtime config, threat model and deployment evidence |
| Authorized operator/provider | Credential storage, enrollment/recovery, saved live state and approved operations |

Deployment order is reviewed source -> verified artifact -> local healthy origin
and isolation -> saved restrictive Access/MFA -> scoped Tunnel/DNS publication ->
external acceptance -> recorded release decision. Saving a published route may
also create DNS; treat it as exposure. Failure must leave the application private.

Official references checked 2026-09-05:

- [Tunnel configuration API](https://developers.cloudflare.com/api/resources/zero_trust/subresources/tunnels/subresources/cloudflared/subresources/configurations/methods/get/)
- [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/)
- [Docker firewall interaction](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
