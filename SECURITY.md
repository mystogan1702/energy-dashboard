Here's a security policy tailored for PesoWatt:

---

# Security Policy

## Supported Versions

Security updates are provided only for the latest firmware and dashboard releases.

| Version            | Supported          |
| ------------------ | ------------------ |
| Latest firmware    | ✅                 |
| Latest dashboard   | ✅                 |
| Older releases     | ❌                 |

---

## Reporting a Vulnerability

If you discover a security vulnerability in PesoWatt (firmware, dashboard, or Firestore rules), please report it privately.

**Do not open a public issue.**

Email us with:

- A clear description of the vulnerability.
- Steps to reproduce it.
- Affected components (firmware, frontend, Firestore rules).
- Any potential impact or exploit scenarios.

### What to Expect

- You will receive an acknowledgement within **48 hours**.
- We aim to provide a fix or mitigation within **7–14 days**, depending on severity.
- Once resolved, we will coordinate a public disclosure timeline with you.
- We appreciate responsible disclosure and will credit reporters unless anonymity is requested.

---

## Security Best Practices for Deploying PesoWatt

- Always **enable Firestore security rules** before deploying to production.
- Use **strong, unique master keys** for each dashboard.
- In production, enable **ESP32 flash encryption** and **secure boot** to protect firmware credentials.
- Regularly update both firmware and dashboard to the latest supported versions.

---

*Thank you for helping keep PesoWatt secure.*
