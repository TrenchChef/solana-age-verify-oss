# Solana AgeVerify — Hackathon Submission

**A privacy-preserving, on-chain age-verification primitive for Solana that proves "18+" without IDs, biometrics, or personal data ever leaving the user's device.**

---

## Links

| | |
|---|---|
| **Live Demo** | [https://www.ageverify.live](https://www.ageverify.live) |
| **GitHub (OSS)** | [solana-age-verify](https://github.com/TrenchChef/solana-age-verify-sdk) |
| **NPM Package** | `solana-age-verify` |
| **Telegram** | @TalkChainLive |
| **X** | @AVSolana |

---

## Track 3: Open Track Pool

Solana Age Verify is a **full-stack privacy primitive**, not a demo or single-use app.

We chose the Open Track because this project is not limited to:
- Payments
- Tooling
- A single vertical

### Real Privacy, Not Optics

- **Zero-storage biometrics:** No photos, no video, no embeddings leave the browser
- **Only a deterministic cryptographic commitment (facehash) is written on-chain**
- Fully aligned with Solana's privacy principles, not reliant on trusted servers

### Production-Grade On-Chain Integration

- Deployed Anchor program with PDA-based registry
- Deterministic, reusable verification state (no repeat scans per dApp)
- Fixed, transparent protocol fee enforced at the contract level (0.0005 SOL)

### Composable Public Infrastructure

- Any Solana dApp can gate access via a single PDA read
- No vendor lock-in, no proprietary API calls required for verification checks
- Works across wallets and apps once verified

### Clear Public-Good Impact

- Enables compliance-heavy verticals (gaming, social, DeFi UX gating)
- Reduces incentives for invasive KYC
- Sets a reusable standard for "proof of adulthood" on Solana

**This is not a hackathon-only artifact; it is a network primitive designed to persist beyond the event.**

---

## Bounties

### QuickNode Public Benefit Prize

Age verification is a **public good problem**:
- Platforms need it
- Users fear it
- No one wants to host the data

**SAS + QuickNode:**
- Removes the need for centralized storage
- Reduces compliance burden for developers
- Improves online safety without surveillance
- Uses QuickNode for reliable transaction broadcasting, dynamic priority fees, and scalable verification reads

This is privacy tooling that scales, not policy theater.

This is exactly what "privacy tooling for the public good" looks like on Solana.

The architecture assumes RPCs can fail—and designs for resilience.
That's the difference between demos and infrastructure.

### Helius Bounty

Helius is foundational to making this reliable at ecosystem scale.

**We use Helius for:**
- High-availability PDA reads
- Redundant verification flows
- Oracle-side verification and observability

The architecture assumes RPCs can fail—and designs for resilience.
That's the difference between demos and infrastructure.

---

## Technical Detail: Sponsor Technologies

Solana Age Verify uses a **hybrid, privacy-first verification model**:

### 1. Client-Side Verification (Browser)

- Face detection, age estimation, and liveness challenges run entirely locally
- Active (gesture-based) + passive (surface analysis) anti-spoofing
- No biometric data ever transmitted or stored

### 2. Deterministic Face Hash

- Geometric facial landmarks → 128-D embedding → SHA-256 hash
- Wallet-bound, salted, non-reversible
- Used for Sybil resistance and verification reuse

### 3. On-Chain Registry (Anchor Program)

- PDA derived from user wallet
- Stores: `over18`, `facehash`, `userCode`, timestamps, expiration
- Adults valid for 180 days; minors for 90 days

### 4. Oracle + SAS Issuance

- Oracle observes chain events
- Issues Solana Attestation Service credential post-verification
- Oracle never exposes signing keys to clients

---

## Sponsor Integrations

### Helius Integration

Helius is used for **high-performance reads and redundancy**:

**Primary RPC for:**
- PDA reads (`fetchCredential`)
- Program state verification
- Oracle monitoring of on-chain events

**Ensures:**
- Low-latency reads for gating checks
- Reliable chain observation for credential issuance

This is critical because verification must be fast, deterministic, and failure-tolerant.

### QuickNode Integration

QuickNode is used for **transaction reliability and public-good scaling**:

- Transaction submission and confirmation
- Priority fee handling during congestion
- Failover pairing with Helius via SDK `RpcManager`

This dual-RPC model ensures verification succeeds even under network stress.

### Light Protocol (ZK Compression — Roadmap)

We explored Light Protocol ZK Compression to minimize on-chain footprint.

**Current status:**
- Not used in V1 due to immutability and auditability requirements
- Verification registry currently uses standard PDA writes (deliberate design choice)

**Roadmap:**
- Evaluate ZK-compressed verification proofs for:
  - High-volume consumer apps
  - Reduced rent overhead
  - Selective disclosure models

This positions the protocol for future scale without sacrificing transparency.

---

## The Problem

Traditional KYC is broken.

- **For Users:** It's invasive. You have to upload your Passport/ID to random dApps, risking massive data leaks.
- **For Developers:** It's expensive ($1-$5 per user) and creates a toxic "Honey Pot" of personal data they don't want to store.
- **Result:** dApps ignore compliance, risking shutdown.

### The Dual Challenge: Protecting Communities & Ensuring Compliance

The internet lacks a middle ground between "total surveillance" and "total anonymity" for age-sensitive spaces.

- **Safety for Minors:** In community gaming and social platforms, verifying adulthood is critical for child safety.
- **Compliance for DeFi:** Regulators are increasingly targeting dApps for lack of "Basic Duty of Care."
- **The Stalemate:** Developers *want* to protect their users but refuse to implement "Honey Pot" KYC that destroys user privacy.

**Solana Age Verify breaks this cycle.** We provide the first **18+ Gateway** that is friction-free for adults but cryptographically robust.

---

## The Solution

A decentralized, privacy-first infrastructure layer that allows users to prove they are **18+** without ever revealing their identity or birthdate.

### Key Innovations

#### 1. Zero-Knowledge Privacy Architecture

- **Client-Side AI:** Our Neural Network runs **entirely in the user's browser**. No images are ever sent to a server.
- **Mathematical Proof:** We generate a unique "FaceHash" from the biometric embedding. The Oracle signs the *transaction*, not the *image*.
- **Data Minimization:** The dApp receives a `true/false` flag and a hash. Nothing else.

#### 2. Hybrid Security Model

- **Open Source Trust:** The verification logic is **MIT Licensed** and visible.
- **Commercial Grade Protection:** While the code is open, our **Anti-Spoofing Tuning** and **AI Model Weights** are proprietary assets.
- **Client-Side Execution:** Privacy is preserved regardless of model license because all processing happens locally.

#### 3. Dual-Network Support

- **Mainnet & Devnet:** Single deployment supports both networks with a user toggle.
- **Dual-Provider RPC:** Built-in `RpcManager` routes traffic between Helius and QuickNode based on health and feature capability.
- **Feature-Specific Routing:** Helius for reads, QuickNode for transaction submission and priority fee estimation.

#### 4. Self-Funding Protocol

- **Unit Economics:** Users pay a **0.0005 SOL** Protocol Fee (500,000 lamports).
- **Self-Sustaining:** This fee covers PDA creation costs, Oracle compute, and Treasury.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Contract** | Solana (Anchor) |
| **AI/ML** | TensorFlow.js / ONNX Runtime (WASM, Client-Side) |
| **Oracle** | Vercel Serverless Functions (Node.js) |
| **Attestation** | Solana Attestation Service (SAS) |
| **RPC** | Helius (reads) + QuickNode (writes) |
| **Frontend** | React + Vite |

---

## Deployment

| Network | Program ID |
|---------|------------|
| **Mainnet** | `AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q` |
| **Devnet** | `AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q` |

---

## Roadmap & Use of Awards

### Short Term
- Mainnet hardening and verified builds
- Wallet-level age credentials via SAS
- Reference integrations for judges to test

### Mid Term
- Registry network effects (verify once, reuse everywhere)
- Fee subsidies to seed adoption
- Governance transition to multisig stewardship

### Long Term
- Decentralized oracle verification
- ZK compression via Light Protocol once it improves cost without breaking auditability
- Age verification as a standard Solana primitive

**Hackathon prizes directly fund:**
- Security audits
- Compression research
- Ecosystem integrations

---

## Getting Started

```bash
# Install SDK
npm install solana-age-verify

# Or integrate via the live demo
# https://ageverify.live
```

See [docs/INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md) for full integration instructions.

---

## License

MIT License — See [LICENSE](LICENSE)
