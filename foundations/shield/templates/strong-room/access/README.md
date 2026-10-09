# Access policy worksheet

Keep the populated worksheet in the application repository or authorized
provider records according to its sensitivity. No API payload is supplied.

- APP_HOSTNAME: exact protected host, including every private path.
- ACCESS_APPLICATION_ID / ACCESS_POLICY_ID: provider metadata.
- AUTHORIZED_IDENTITIES: explicitly approved selectors; deny all other users.
- ACCESS_AUD: this app only; align with connector validation.
- Login method, MFA_METHOD, MFA_FREQUENCY and ACCESS_SESSION_DURATION:
  application-owned risk decisions, verified after save/reopen.
- Enumerate every applicable policy, precedence/overlap and alternative login
  path; no Everyone, Bypass or Service Auth shortcut to interactive private content.
- Record enrollment, recovery, revocation, and least-privilege admin ownership
  without secret or identity-selector values in reusable examples.

The Control-derived OTP profile requires email OTP plus independent TOTP and
`Require every login`. Email OTP alone is not MFA. Verify organization enablement,
application settings and policy overrides; a policy can override a broader MFA
requirement. This does not require a particular authenticator brand for other apps.
Higher-risk apps should assess phishing-resistant alternatives.

A saved MFA toggle is not proof of the login sequence. Test permitted identity,
unapproved identity, missing/incorrect MFA, and a fresh login requiring the
second factor again. Use an interactive operator flow: never collect codes,
seeds, QR enrollment, cookies or tokens into evidence.

Sources checked 2026-09-05:
[Independent MFA](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/independent-mfa/),
[MFA enforcement](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/mfa-requirements/),
[One-Time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/).
