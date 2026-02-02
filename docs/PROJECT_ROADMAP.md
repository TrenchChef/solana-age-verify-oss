# Solana Age Verify (SAS) - Project Roadmap & Strategy

## Executive Summary
**Solana Age Verify (SAS)** is a privacy-preserving infrastructure layer for age and identity verification on the Solana blockchain. By anchoring biometric "face hashes" to the chain without storing personal data, we provide a scalable, low-cost solution for regulated dApps.

This document outlines the strategic roadmap for open-sourcing the project, ensuring defensibility, and evolving toward a decentralized network (V2).

---

## Phase 1: The "Hybrid" Open Source Launch (Hackathon)
**Objective:** Release a fully functional, open-source V1 that maximizes trust while protecting commercial IP.

### 1.1 The "Hybrid Defense" Strategy
We solve the "Open Source vs. Commercial Defense" dilemma by decoupling the **Code** from the **Intelligence**.

*   **The Shell (Code):** **MIT License.**
    *   **Components:** `age-verify-sdk`, `solana-age-registry` (Anchor Program), `verify.ts`.
    *   **Reasoning:** Ensures absolute transparency. Developers and Judges can audit *how* we process data, guaranteeing that no images are sent to the server. This satisfies the "Privacy Preserving" requirement.
*   **The Brain (Model Weights & Config):** **Proprietary / Protected.**
    *   **Components:** AI Model Weights (`.bin`), Calculation Thresholds, Calibration Configs.
    *   **Reasoning:** The effectiveness of the anti-spoofing relies on specific tuning and expensive ML training. These assets are protected.
    *   **Mechanism:** The SDK fetches a **Dynamic Config Blob** from the Oracle (`api.ageverify.live`) at runtime. This blob contains the encrypted thresholds and signatures required to run the models.

### 1.2 Current Progress (v1.0 Ready)
*   ✅ **PDA Registry:** PDA-based verification records live in `solana-age-registry`.
*   ✅ **PDA-Only Flow:** ZK/Light compression removed from verification writes and checks.
*   ✅ **Protocol Fee Finalized:** 0.0005 SOL (500,000 lamports) per verification.
*   ✅ **Program ID:** `AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q` (Devnet/Mainnet ready).
*   ✅ **Oracle Development:** `api.ageverify.live` operational with strict origin checking.
*   ✅ **SDK Maturity:** Core verification, liveness detection, and SAS integration complete.
*   ✅ **Documentation:** Comprehensive guides, API reference, and technical specs updated.
*   [ ] **Explorer branding:** Security.txt live; verified build registered; Solscan + Solana Explorer logo/metadata submitted.

---

## Phase 2: Mainnet Hardening & Governance
**Objective:** Establish the "Registry State" moat and transition to community-led governance.

### 2.1 Governance (The "Squads" Transition)
*   **Tooling:** **Squads V4** (Standard Multisig on Solana).
*   **Structure:** **3-of-4 Multisig** holding the [Upgrade Authority] of the `age_registry` program.
*   **Proposed Council:**
    *   **TalkChain** (Lead Developer)
    *   **Helius** (Infrastructure Partner)
    *   **Quicknode** (Infrastructure Partner)
    *   **Security SME** (Privacy/Safety Partner)
*   **Goal:** Prove "Credible Neutrality" immediately. No single entity can change the code or maliciously freeze the program.

### 2.2 Growth Strategy
*   **Network Effect:** Subsidize fees for the first 10k users to seed the registry.
*   **Direct Integration:** Partner with wallet providers to native-support SAS age verification status.
*   **Developer Ecosystem:** Provide starter kits and reference implementations for dApps needing age-gated entrance.

---

## Phase 3: The V2 Evolution (Decentralized Oracle)
**Objective:** Eliminate the centralized Oracle to enable "Unstoppable" verification.

### 3.0 Long-Range Privacy Path (Arcium TEE - Under Evaluation)
*   **Positioning:** Arcium TEE is a long-range roadmap item **after** the Infrastructure Council is operational.
*   **Rationale:** Client-side models are **privacy-by-design** and remain the default unless a TEE upgrade clearly improves trust *without* weakening privacy.
*   **Decision Gate:** Any move to TEEs requires a formal security and privacy review, plus ecosystem partner buy-in.

### 3.1 Multi-Node Consensus
*   **Architecture:** A **"Council of Guardians"** composed of TalkChain + top-tier infrastructure providers.
*   **Mechanism:**
    *   The browser transmits the proof to **3 Nodes Simultaneously**.
    *   The transaction requires signatures from at least **2 of 3 Council Nodes**.
*   **Commercial Model (The Split):** 
    *   **Node Revenue (80%):** Majority fee paid to the nodes signing the transaction.
    *   **Protocol Royalty (20%):** Constant flow to the Protocol Treasury for IP support.

---

## Appendix: Risk Assessment
| Risk | Mitigation |
| :--- | :--- |
| **Code Forking** | MIT License for logic, but **Model Weights** remain protected. A fork is a "gun without bullets." |
| **Spoofing** | Dynamic Oracle Config allows tightening thresholds in real-time without client redeploy. |
| **Regulatory** | Privacy-by-design approach: We are a "Technology Provider," not a Data Controller. |

---
**Last Updated:** 2026-01-28  
**Status:** Hackathon Submission Ready  
