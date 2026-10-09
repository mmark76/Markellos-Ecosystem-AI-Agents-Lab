# Logout

When Access is the authentication authority, integrate the same-origin link:

```html
<a href="/cdn-cgi/access/logout">Sign out</a>
```

The edge handles this endpoint at APP_HOSTNAME. Do not add an NGINX fake logout,
token storage, a second login service or independent application sessions.
Local development without Access does not validate this behavior.

Test a fresh private request after sign-out, reauthentication/MFA, other open tabs,
and back/reload caching. Do not claim instant invalidation of all issued tokens
or removal of content already downloaded. Cloudflare documents cross-application
session revocation and a propagation interval; record observed behavior and the
current provider guarantee. An upstream IdP session may survive Access logout.

[Cloudflare session management](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/).
