# Verify no public application port

Read-only procedure for SR-04 / AC-04. Record app-owned target inventory and
authorization before probes. Do not scan unrelated systems.

1. Establish an authoritative list of host interfaces/global IPv4 and IPv6
   addresses, application ports, container networks, Docker NAT/direct-routing
   modes, DNS aliases and proxy entry points. Record probe machine and route.
2. Check requested AND effective Docker port mappings with the origin helper.
   On the host inspect TCP/UDP listeners with `ss -lntup`; interpret the local
   address column, not the peer column. Inspect all interfaces and both families.
   No public/wildcard application listener is allowed.
3. Check `docker port`, exact host-local HTTP health, dedicated network membership,
   public proxy routing/labels and network peers. Lack of an ss socket alone is
   not proof: Docker may publish through NAT. A local 200 alone is insufficient.
4. Review firewall defaults and effective Docker packet-filtering/routing rules.
   Do not equate UFW default deny with blocked Docker publication. Preserve shared
   rules; do not modify firewall/daemon settings to make a check pass.
5. From an independent authorized external client test every inventoried direct
   origin IP and application port. Include HTTP Host and TLS SNI matching
   APP_HOSTNAME on shared proxy ports. Test known alternate hostnames, routes,
   unpublished/legacy hosts and direct container routing where applicable.
6. Repeat with an independently external IPv6-capable client. Prove that client
   has a working IPv6 route/control target. Same-host own-global-address probes
   do not satisfy this step.
7. Confirm no response reveals private content. Inspect redirects without
   automatically following them; an arbitrary 302/403/404 is not proof of Access.
   TLS failures are not valid-TLS denial evidence. If a separately authorized
   diagnostic ignores TLS verification, label it diagnostic and assess content.
8. Correlate refusal/timeouts with host and route evidence. A timeout by itself
   can mean a broken client or route; record BLOCKED until ambiguity is bounded.

Record target/port, hostname/SNI, IP family, vantage, date, expected result,
observed status/content classification and evidence. Exclude raw headers, cookies,
tokens and redirect query strings. Use the baseline's five statuses.

A PASS applies only to enumerated paths and time. If independent IPv6 is
unavailable, record TECHNICALLY UNAVAILABLE, supporting checks and the coverage
gap. Never claim universal IPv6 protection or universal no-bypass.

[Docker port publication](https://docs.docker.com/engine/network/port-publishing/)
and [firewalls](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
describe NAT/routing behavior; older Docker versions also have known
loopback-publication limitations. Check the adopting engine/version.
