# Privacy Principles

Solana Age Verify is built on the core principle of **Zero-Storage Biometrics**. We ensure user privacy through strict client-side isolation and data minimization.

## Core Commitments

1.  **Local-Only Processing**: We never transmit camera frames, images, biometric embeddings, or facial descriptors off the user's device. All inference occurs in the local browser context via Web Workers.
2.  **Minimized Output**: The system only outputs the final verification status (`over18`), a deterministic `facehash` commitment, and necessary metadata (timestamps, confidence scores).
3.  **No Persistent Tracking**: We avoid using session identifiers or persistent cookies that aren't strictly required for the immediate age gating process.
4.  **Deterministic Anonymity**: The `facehash` is a one-way cryptographic commitment. It confirms identity uniqueness without exposing any raw biometric features or personally identifiable information (PII).
5.  **Data Expiration**: On-chain verification records expire by default (90 days for adults, 30 days for minors), ensuring proofs stay current without permanent biometric storage.

## Data Storage Model

| Data Type | Storage Location | Retention | Visibility |
| :--- | :--- | :--- | :--- |
| **Face Image** | **NOWHERE** | N/A | None |
| **Biometric Embedding** | Browser RAM (Ephemeral) | ~30 seconds (Scan duration) | User Only |
| **Face Hash** | Solana Blockchain (PDA) | Permanent/Updateable | Public (Pseudonymous) |
| **User Code** | Solana Blockchain (PDA) | Permanent/Updateable | Public |
| **Age Estimate** | Browser RAM (Ephemeral) | ~30 seconds | User Only |
| **IP Address** | Oracle Logs | 7 Days (Security Rotation) | Private (Ops Team) |

## Transparency

All verification results recorded on the Solana blockchain are public, providing a transparent and auditable proof of adherence to age requirements without compromising individual identities.

## Biometrics vs On-Chain Visibility

Privacy applies to **biometrics only**: we do not expose raw face data, images, or embeddings. Verification **results** (e.g. `facehash`, `user_code`, `over_18`) and **events** (e.g. `VerificationEvent` in program logs) are intentionally **public**. They appear in transaction logs and on explorers such as Solscan, which matches our commitment to transparency and auditability. Reducing the event payload or hiding these outcomes would reduce that transparency.

**Last Updated**: January 17, 2026
