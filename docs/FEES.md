# Fees

This document is the **source of truth** for fee display and balance requirements in the demo app, and lists **every place** that mentions protocol, app, oracle/network, or total fees (including SOL amounts) so that when fees change, all references can be updated **uniformly**. See [docs/specs/IMMUTABLES.md](specs/IMMUTABLES.md) for protocol-level invariants (e.g. Protocol Treasury, fixed protocol fee).

---

## 1. Source of truth (demo app)

### Exact cost breakdown (on-chain verification)

Per verification transaction, the user pays the following. All amounts are exact except PDA rent, which is cluster-dependent (use `getMinimumBalanceForRentExemption(67)` at runtime for the current value).

| Component | Lamports | SOL | Note |
|-----------|----------|-----|------|
| **Base (signature)** | 5,000 | 0.000005 | Solana base fee: 5,000 lamports per signature; one signer per tx. |
| **PDA rent (67 bytes)** | 911,760 | 0.00091176 | Rent-exempt minimum for `VerificationRecord` (8+32+9+1+8+8+1 bytes). From `getMinimumBalanceForRentExemption(67)`; mainnet-typical. |
| **Protocol Fee** | 500,000 | 0.0005 | Fixed; to Protocol Treasury. See [IMMUTABLES.md](specs/IMMUTABLES.md). |
| **App Fee** | 1,000,000 | 0.001 | Demo app; integrator-set in general. |
| **Total (exact)** | **2,416,760** | **0.00241676** | Base + PDA rent + Protocol + App. |

Optional: prioritization (compute-unit) fee adds on top; the app uses a small buffer (e.g. 0.001 SOL) for network/gas so recommended balance is **≥ 0.003 SOL**.

### Current breakdown (UI / recommended balance)

| Component        | Amount    |
|-----------------|-----------|
| Protocol Fee    | 0.0005 SOL |
| App Fee         | 0.001 SOL |
| Network (nominal)| ~0.001 SOL |
| **Total fee**   | **~0.003 SOL** |

Protocol and oracle/network numbers in the broader system are defined in [docs/specs/IMMUTABLES.md](specs/IMMUTABLES.md); the table above is the demo-app breakdown.

### Recommended balance

To run verification, users should have at least **≥ 0.003 SOL**. The app uses this threshold for the pre-verification balance check.

### UI

- **Wallet balance** and **total fee** are shown under the **Start Verification** button.
- **Recommended balance: ≥ 0.003 SOL** is also displayed there so users understand why the check may reject lower balances.

### Adjustments

**We will want to adjust these fees when the time comes.** Fees will be finalized once transactions and programs are optimized. This file will be updated accordingly. The demo app uses `apps/web/src/constants/fees.ts` for shared constants; update that module and this doc together.

---

## 2. When changing fees

1. Update [docs/specs/IMMUTABLES.md](specs/IMMUTABLES.md) (and [docs/specs/TRANSACTION_FLOWS.md](specs/TRANSACTION_FLOWS.md) if needed).
2. Update this document and `apps/web/src/constants/fees.ts` together.
3. Walk the **Fee mention inventory** below and update each listed location.
4. Run the immutables gate and pre-commit checklist.

**Protocol fee change** also requires: program (`lib.rs`) + SDK (`security.ts`, `types.ts`, `verify.ts`); then all web app and docs entries in the inventory.

---

## 3. Fee mention inventory

### 3.1. Specs (source of truth — update first)

| File | Location | Type | Mentions | Note |
|------|----------|------|----------|------|
| [docs/specs/IMMUTABLES.md](specs/IMMUTABLES.md) | §2 Business Logic & Fees | Protocol, App, Oracle, Total | Protocol `0.0005 SOL`; App dynamic; Oracle ~`0.0023 SOL`; Total = Protocol + App + Oracle/network | **Source of truth.** Update first when fees change. |
| [docs/specs/IMMUTABLES.md](specs/IMMUTABLES.md) | §3 Infrastructure table | Protocol | "0.0005 SOL fee" to Protocol Treasury | Same. |
| [docs/specs/TRANSACTION_FLOWS.md](specs/TRANSACTION_FLOWS.md) | §2 step 8 | Protocol | User signs `0.0005 SOL` to Protocol Treasury | Flow immutable when working. |
| [docs/specs/TRANSACTION_FLOWS.md](specs/TRANSACTION_FLOWS.md) | §3 Fee flow | Protocol, App, Oracle, Total | Protocol `0.0005 SOL`; App integrator-set; Oracle/rent ~`0.0023 SOL`; "No change to Protocol fee..." | Same. |

### 3.2. Program (on-chain)

| File | Location | Type | Mentions | Note |
|------|----------|------|----------|------|
| [packages/solana-age-registry/programs/age_registry/src/lib.rs](../packages/solana-age-registry/programs/age_registry/src/lib.rs) | `create_verification` / `update_verification` | Protocol, App | `protocol_fee = 500_000` lamports (0.0005 SOL); `app_fee` param | **Code constant.** Changing protocol fee requires program upgrade + IMMUTABLES update. |

### 3.3. SDK

| File | Location | Type | Mentions | Note |
|------|----------|------|----------|------|
| [packages/age-verify-sdk/src/security.ts](../packages/age-verify-sdk/src/security.ts) | `_F_B`, `getProtocolFee` | Protocol | Fallback `0.0005` SOL | **Code constant.** |
| [packages/age-verify-sdk/src/types.ts](../packages/age-verify-sdk/src/types.ts) | `VerifyHost18PlusConfig`, `VerifyResult` | Protocol, App | `protocolFeeSol`, `appFeeSol`; default `protocolFeeSol: 0.0005`; `protocolFeePaid`, `protocolFeeTxId`, `appFeePaid`, `appFeeTxId` | Config defaults; result fields. |
| [packages/age-verify-sdk/src/verify.ts](../packages/age-verify-sdk/src/verify.ts) | balance check, fee modal, fee payment flow | Protocol, App, Gas | `getProtocolFee`, `config.appFeeSol`; gas buffer `0.001` SOL; user-facing strings "protocol fee", "integrator fee", SOL amounts | **User-facing** (modals) + **code constant** (gas buffer). |
| [packages/age-verify-sdk/src/idl.ts](../packages/age-verify-sdk/src/idl.ts) | IDL args | App | `appFee` (u64) | IDL; no hardcoded amount. |

### 3.4. Web app

| File | Location | Type | Mentions | Note |
|------|----------|------|----------|------|
| [apps/web/src/App.tsx](../apps/web/src/App.tsx) | fee constants, `verifyHost18Plus` config, logs, UI copy | Protocol, App, Total, Gas | `protocolFee` `0.0005`, `appFee` `0.001`, `totalRequired` (+ `0.001` gas); "0.003 SOL"; `protocolFeeTxId` | **User-facing** + **code constant.** Keep aligned with ToS, Help, Wiki. |
| [apps/web/src/Help.tsx](../apps/web/src/Help.tsx) | "What is the fee?" section | Protocol, App, Network, Total | Protocol `0.0005 SOL`; Network ~`0.001 SOL`; App `0.001 SOL`; Total `~0.003 SOL` | **User-facing.** |
| [apps/web/src/Wiki.tsx](../apps/web/src/Wiki.tsx) | cost copy, comparison table, fee breakdown | Protocol, App, Total | "0.0015 SOL (0.0005 + ~0.001 tx)"; "0.0005 SOL"; "0.001 SOL"; "~0.003 SOL" | **User-facing.** |
| [apps/web/src/TermsOfService.tsx](../apps/web/src/TermsOfService.tsx) | §3 Fees and Costs | Protocol, App, Total | Protocol `0.0005 SOL`; App `0.001 SOL`; total ~`0.003 SOL`; fee-update note | **User-facing / legal.** |
| [apps/web/src/Hackathon.tsx](../apps/web/src/Hackathon.tsx) | Self-Funding copy | Total (approx) | "about 0.0005 SOL fee" (protocol-only ballpark) | **User-facing.** |

### 3.5. Docs

| File | Location | Type | Mentions | Note |
|------|----------|------|----------|------|
| [README.md](../README.md) | Cost table, integration snippet | Protocol, Total | "~0.0015 SOL" cost; "0.0005 SOL protocol fee"; `protocolFeePaid`, `protocolFeeTxId` | **User-facing** / integrator. |
| [docs/QUICK_START.md](QUICK_START.md) | Result check, monetization bullet | Protocol | `protocolFeePaid`; "Protocol fee + optional app fee" | **Docs.** |
| [docs/INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Wallet / fee snippet | Protocol | "0.0005 SOL protocol fee" | **Docs.** |
| [docs/API_REFERENCE.md](API_REFERENCE.md) | Types, examples | Protocol, App | "0.0005 SOL protocol fee"; `protocolFeePaid`, `protocolFeeTxId`, `appFeePaid`, `appFeeTxId`; `protocolFeeSol`, `appFeeSol`; example `0.0005` | **Docs.** |
| [docs/USER_VERIFICATION_GUIDE.md](USER_VERIFICATION_GUIDE.md) | Protocol Fee bullet | Protocol | "0.0005 SOL" | **User-facing docs.** |
| [docs/DEPLOY_MAINNET.md](DEPLOY_MAINNET.md) | Fee structure | Protocol, App | "0.0005 SOL (500,000 lamports)"; "App Fee: Configurable" | **Docs.** |
| [docs/HACKATHON_SUBMISSION_PLAN.md](HACKATHON_SUBMISSION_PLAN.md) | Checklist | Protocol | "0.0005 SOL Protocol Fee" | **Docs.** |
| [docs/PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) | Protocol Fee bullet | Protocol | "0.0005 SOL (500,000 lamports)" | **Docs.** |
| [docs/TECHNICAL_PATCH_AUDIT.md](TECHNICAL_PATCH_AUDIT.md) | Patch note | Protocol | "protocol fee payments" | **Docs.** |
| [docs/specs/LIVENESS_DETECTION.md](specs/LIVENESS_DETECTION.md) | Strikes / on-chain | Protocol | "saving the user the protocol fee" (conceptual) | **Docs.** |
| [docs/INVESTMENT_MEMO.md](INVESTMENT_MEMO.md) | Fee structure, tables | Protocol, App, Oracle, Total, Deployment | "0.0005 SOL" Protocol Fee; Dynamic App Fee; "~0.0015 + App Fee"; "~0.005 SOL" deployment; etc. | **Docs.** |
| [packages/age-verify-sdk/README.md](../packages/age-verify-sdk/README.md) | Table, options, example | Protocol, App | "0.0005 SOL"; `appFeeSol`; `protocolFeeTxId`; example `appFeeSol: 0.001` | **Docs.** |

### 3.6. Other

| File | Location | Type | Mentions | Note |
|------|----------|------|----------|------|
| [ABOUT_OUR_HACKATHON_SUBMISSION.md](../ABOUT_OUR_HACKATHON_SUBMISSION.md) | Unit Economics | Protocol | "0.0005 SOL" Protocol Fee (500,000 lamports) | **Docs.** |
| [.SECRET_VAULT.md](../.SECRET_VAULT.md) | Integrator / Protocol roles | App, Protocol | "App Fee (0.001 SOL)", "Protocol Fee (0.0005 SOL)" — **role descriptions only**; amounts may be stale (demo total vs protocol). Verify when updating fees. | **Ops; do not commit.** |

### 3.7. Excluded (not our fee or not fee-related)

- `packages/age-verify-sdk/src/liveness/surface.ts` — `0.005` is a frequency ratio (liveness), not a fee.
- `docs/SOLANA_ECOSYSTEM_PATCH_TRACKER.md` — "Protocol Fee Error" refers to RPC/program behavior, not our fee amounts.

### 3.8. Usage

- **Protocol fee change:** Update IMMUTABLES + TRANSACTION_FLOWS; program (`lib.rs`) + SDK (`security.ts`, `types.ts`, `verify.ts`); all web app and docs entries above; then run immutables gate.
- **App fee / demo total change:** Update App, Help, Wiki, ToS, and any docs that state demo app fee or total (e.g. `0.001` / `0.003`). Keep ToS §3 and in-app copy in sync.
- **Legal / Docs:** Legal Expert and Docs/DX use this inventory to ensure ToS, Help, Wiki, and other user-facing copy stay consistent when fees change.
