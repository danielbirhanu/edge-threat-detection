# Initial Threat Model

## Assets

- Availability of the protected API and gateway.
- Login and API credentials.
- Detection configuration and behavioral state.
- Security events and dashboard access.

## Initial threats

- Brute-force attempts, endpoint scanning, and rate abuse.
- Header spoofing intended to evade identity tracking.
- Accidental storage or logging of credentials and request bodies.
- False positives against legitimate high-volume clients.

## Initial controls

- Treat Cloudflare connection metadata as authoritative in deployed environments.
- Never persist authorization headers, passwords, or raw request bodies.
- Use bounded, expiring per-identity state.
- Separate detector signals, risk scoring, and enforcement policy.
- Require a legitimate burst scenario in security tests.

## Known limitations

The foundation contains no production detection rules. Initial behavioral baselines will be simulator-derived and must not be presented as production-validated accuracy.
