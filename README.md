# Solana Age Verify


**Verify users as 18+ on-chain. Privacy-safe, no ID needed, run entirely in the browser.**

## What is Solana Age Verify?

**Solana Age Verify** is a premium, privacy-preserving biometric identity primitive built specifically for the Solana ecosystem. It enables developers to gate content or services based on age (>18) without ever handling, storing, or seeing raw facial data. It writes a lightweight on-chain verification record (PDA) and triggers SAS attestation, providing a composable, "KYC-lite" layer for regulated or age-restricted dApps.

## Why Developers Choose Solana Age Verify

Integrate institutional-grade age verification in under 5 minutes with a simple React-friendly SDK.

Privacy-safe, on-chain, and run entirely in the browser: no passports, no IDs, no credit cards. Just a face scan and a wallet signature.

- **Developer Velocity**: Integrate institutional-grade age verification in under 5 minutes with a simple React-friendly SDK.
- **Zero-Knowledge Biometrics**: Privacy is the feature. No face data leaves the user's RAM. No GDPR/CCPA headaches for developers.
- **Hybrid Security Model**: Combines **Open Source Logic** (MIT) with **Proprietary Anti-Spoofing Intelligence** (Protected Assets) to prevent bot attacks while maintaining transparency.
- **Composable Identity**: Verification records are on-chain and SAS attestations make credentials portable across protocols.
- **Premium Aesthetics**: Glassmorphic HUD that elevates your dApp's UX.

## Age Verify vs. Traditional KYC

| Feature | Solana Age Verify | Traditional KYC |
| :--- | :--- | :--- |
| **Verification Speed** | 10 Seconds | 2+ Days |
| **User Data Storage** | Zero (RAM Only) | Centralized PII |
| **Privacy Level** | Zero-Knowledge Biometrics | Full Identity Disclosure |
| **User Friction** | No IDs/Cards Needed | Passport/Selfie/Bills |
| **Cost per User** | ~0.006 SOL | $5.00 - $15.00+ |
| **Composability** | On-Chain Verification Record + SAS Attestation | Siloed Database |

## ✨ Features

- **Private**: Biometric inference happens entirely in the user's browser.
- **Secure**: Uses Active Liveness (Gestures) + Passive Liveness (Surface) + **Dynamic Config** (Server-Side Tuning).
- **On-Chain**: Cryptographically linked to Solana wallets.
- **Resilient RPC**: Built-in `RpcManager` with multi-endpoint failover and Priority Fee optimization.
- **Attestation-Ready**: SAS issuance via Oracle service.
- **Premium UI**: Built-in glassmorphic HUD.

## 🔒 Privacy & Security (Hybrid Model)

We use a **"Hybrid Defense"** architecture to balance Open Source trust with commercial-grade security:
1.  **Open Logic (MIT):** The client-side code (`verify.ts`) is open. You can verify that **no images are sent to our servers**.
2.  **Protected Intelligence:** The AI Model Weights and Anti-Spoofing Thresholds are proprietary. The SDK fetches a signed **Calibration Blob** from the Oracle (`api.ageverify.live`) at runtime to configure the security parameters dynamically.

## 🚀 Quick Start

```bash
npm install solana-age-verify
```

```typescript
import { verifyHost18Plus } from 'solana-age-verify';
// Import your worker (browser-specific)
import AgeWorker from 'solana-age-verify/dist/worker/worker.js?worker';

const result = await verifyHost18Plus({
  walletPubkeyBase58: userWallet.publicKey.toBase58(),
  rpcUrls: [process.env.HELIUS_RPC!, process.env.QUICKNODE_RPC!], // Dual-RPC failover
  wallet: userWallet,           // Signer for the 0.0005 SOL protocol fee
  uiMountEl: document.getElementById('hud-container')!,
  workerFactory: () => new AgeWorker(), // Required for stability
});

if (result.over18 && result.protocolFeePaid) {
  console.log("Verified! Transaction:", result.protocolFeeTxId);
}
```

## Mainnet & Networks

- **Program ID (Devnet & Mainnet):** `AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q`
- **Live webapp:** [ageverify.live](https://ageverify.live) — use the **Network** dropdown in the header to switch between **Devnet** and **Mainnet**.
- **NPM package:** [solana-age-verify](https://www.npmjs.com/package/solana-age-verify)

For mainnet deployment (program deploy, Vercel env, SAS credentials), see [docs/DEPLOY_MAINNET.md](docs/DEPLOY_MAINNET.md) and [docs/MAINNET_CHECKLIST.md](docs/MAINNET_CHECKLIST.md).

## 📖 Documentation

- [**Project Roadmap & Strategy**](docs/PROJECT_ROADMAP.md) (Read this first!)
- [Quick Start Guide](docs/QUICK_START.md)
- [SDK Integration Guide](docs/INTEGRATION_GUIDE.md)
- [How Age Verification Works](docs/HOW_AGE_VERIFICATION_WORKS.md)
- [**MCP agents**](mcp-agents/README.md) — Model Context Protocol server for AI agents (Cursor, Claude, etc.); tools and resources for this repo.
- [**Multi-agent workflow**](mcp-agents/docs/MULTIAGENT_WORKFLOW.md) — MCP agents, context pack, kickoff and pre-push gates aligned to [IMMUTABLES](docs/specs/IMMUTABLES.md).
- [**MCP workflow model**](mcp-agents/docs/MCP_WORKFLOW_MODEL.md) — Exhaustive behavior reference (reusable model for future projects).
- [**Tools and gates**](mcp-agents/docs/TOOLS_AND_GATES.md) — Local verify script, CI, Dockerized Anchor, pre-commit checklist.
- [**Transaction flows**](docs/specs/TRANSACTION_FLOWS.md) — Biometric load, verification, fee, Oracle (immutable when working).
- [**Ready to work**](mcp-agents/docs/READY_TO_WORK.md) — Checklist before starting (immutables, keypairs, flows, biometric load, build gates).

## 🛠️ Development

To run the project locally, you must target the Live Oracle for configuration or whitelist your localhost.

```bash
# Install dependencies
pnpm install

# Build the SDK and Worker
pnpm build

# Run the demo app
pnpm dev
```
*Note: The AI Models require a valid origin. If `localhost` fails, please use the live demo or request a dev key.*

## 📜 License

- **Code:** MIT
- **Models/Assets:** Proprietary (CC-BY-NC-ND)
