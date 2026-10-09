# Alerting architecture — next phase

External alert delivery must not depend solely on Ecosystem Control. A Control
outage must not suppress detection, delivery or escalation.

Security detects -> independently available external alert channel ->
Control displays/tracks the incident when available.

Define a primary external channel, delivery-failure escalation or fallback,
responsible responder, severity, acknowledgment target, deduplication, recovery
notification and retention. Test both Control-down and monitor-down scenarios.
Correlate incidents in Control without giving its display path authority to
suppress the only external alert.

Alerts contain a scoped non-secret event summary and authorized evidence link,
not emails/selectors, credentials, raw headers, JWTs, cookies or enrollment material.
Credentials and destination addresses stay in approved operational configuration.

This task defines requirements only. No notifications, channels, rules or
monitoring services are configured or sent.
