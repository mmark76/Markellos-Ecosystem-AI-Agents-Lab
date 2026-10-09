# Tunnel pattern

Control's documented topology is remotely managed. This directory's
[ingress fragment](ingress.yaml.template) is a new parameterized equivalent,
not an exported Control route.

For a locally managed tunnel, identify TUNNEL_ID in the application-owned full
configuration and insert only the rendered entry into its existing ingress list
before its terminal catch-all. New complete configurations need a final
`service: http_status:404` catch-all. Validate the complete file using
`cloudflared tunnel ingress validate` and test representative URL matching with
`cloudflared tunnel ingress rule` for the installed version.
Never replace a shared full configuration with this one-entry fragment.

For a remotely managed tunnel, inspect the existing route set, add only the
intended app route, and enable Protect with Access with the exact team/audience
or the currently supported equivalent. Save/reopen and verify effective state.
Do not convert its management mode or add a local credentials/config file.

`required: true` means absence of valid Access authorization denies traffic.
The validator must enforce token signature, issuer, audience and lifetime.
A static origin does not acquire JWT validation merely by receiving headers.
Test the validator separately from the edge using an isolated authorized harness;
do not switch off production Access to reach it.

Record before/after route and generated DNS deltas without tokens. Preserve
every unrelated route, its order and options, and coordinate concurrent changes.
Restrictive Access/MFA and local isolation precede publication.

[Cloudflare configuration fields](https://developers.cloudflare.com/api/resources/zero_trust/subresources/tunnels/subresources/cloudflared/subresources/configurations/methods/get/)
and [local configuration](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/local-management/configuration-file/)
must be checked against the adopting app's installed cloudflared version.
