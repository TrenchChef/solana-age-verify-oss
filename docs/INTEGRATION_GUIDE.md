# On-Chain Integration Guide

This guide details how to integrate with the on-chain verification record stored by the `age_registry` program and the required SAS attestation flow.

## Schema Details
The on-chain record is a PDA derived from the user’s wallet (`[b"verification", authority]`) and stores the verification proof fields directly.

### 1. `over18` (Boolean)
*   **Description**: Confirms the user is 18 years or older.
*   **Format**: `true` (1) or `false` (0).
*   **Purpose**: instant gating logic for dApps (e.g., `if (cred.over18) allow()`).

### 2. `facehash` (String)
*   **Description**: A unique 32-byte cryptographic fingerprint.
*   **Format**: Hex encoded string.
*   **Privacy**: This **cannot** be reversed into a face image. It is used to ensure one-person-one-account (Sybil resistance). If the same face scans again, it generates the same hash (with minor variance managed by the Oracle).

### 3. `usercode` (String)
*   **Description**: A unique 5-digit alphanumeric code (Base34: A-Z, 2-9).
*   **Format**: Example `XP79K`.
*   **Purpose**: human-readable identifier for lookups.

### 4. `expiration` (Number/Int64)
*   **Description**: The Unix timestamp (seconds) when this verification becomes invalid.
*   **Policy**: 
    - **Adults (18+):** 90 days from issuance.
*   **Usage**: Verifiers MUST check `Date.now() / 1000 < credential.expiration`.

### 5. `verification_date` (Number/Int64)
*   **Description**: The Unix timestamp (seconds) when the scan was performed.

### 6. `bump` (Number)
*   **Description**: Seed/Instance ID for SAS compatibility.

## Integration Steps

### 1. Installation
```bash
npm install solana-age-verify
```

### 2. Initialize and Verify
The SDK handles the complexity of the **Hybrid Security Model** automatically. When you call `verifyHost18Plus`, it securely fetches the latest anti-spoofing thresholds and encrypted model weights from our Oracle.

```typescript
import { verifyHost18Plus } from 'solana-age-verify';
import AgeWorker from 'solana-age-verify/dist/worker/worker.js?worker';

// 1. Trigger the Verification Flow
const result = await verifyHost18Plus({
    walletPubkeyBase58: userWallet.publicKey.toBase58(),
    rpcUrls: [process.env.HELIUS_RPC!, process.env.QUICKNODE_RPC!], // Dual-RPC failover
    wallet: userWallet, // Signs the 0.0005 SOL protocol fee
    uiMountEl: document.getElementById('hud')!,
    workerFactory: () => new AgeWorker()
});

// 2. Handle Result
if (result.over18) {
    console.log("Success!", result.facehash);
}
```

### 3. Verify Credential (On-Chain) and Fetch Later
Once a user is verified, any dApp can check their status **without** re-running the biometric scan. Use `fetchCredential` to fetch the verification record (including `user_code`) later for any wallet.

**Note:** This is a standard PDA read. Any Solana RPC can fetch it via `getAccountInfo`, or you can use the SDK helper.

```typescript
const cred = await fetchCredential(connection, userPublicKey);

if (cred && cred.over18 && cred.expiration > Date.now()/1000) {
    console.log("Status: Verified", cred.usercode);
    // Access Granted
}
```

## Performance & Limits

### Compute Unit (CU) Limits
The verification transaction is optimized to fit within a tight compute budget to ensure high priority on the network.
- **Max Compute Units:** `150,000` (Optimized from 1.4M)
- **Priority Fee:** Dynamic (configured via `RpcManager` or defaults)

The SDK automatically sets this limit in the transaction builder. If you are manually building transactions (advanced), ensure you set the Compute Unit Limit to `150,000` to avoid over-provisioning costs or scheduler deprioritization.

## Security & Architecture (The Hybrid Model)

Our verification process uses a unique **"Open Logic, Protected Intelligence"** architecture:

1.  **Face Detection & Landmark Analysis (Client-Side):** The browser runs the neural network. **No images are sent to the server.**
2.  **Dynamic Calibration (Server-Side):** The SDK pulls a signed "Calibration Blob" from `api.ageverify.live` containing the latest anti-spoofing thresholds. This allows us to update security against new bot attacks instantly without requiring users to update their SDK.
3.  **Liveness Detection:**
    *   **Active:** Gestures (Nod, Turn).
    *   **Passive:** Texture analysis (Texture detection models are encrypted assets).
4.  **SAS Credential Issuance:** The Oracle watches the chain and issues a SAS credential after a successful on-chain verification record is created or updated.

## Registration Status (Mainnet)
*   **Schema Name**: `AgeVerificationCredential_v2`
*   **Issuer**: Platform Wallet (`Vrfyb...k`)
*   **Program**: `AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q`


### 🛰️ Automatic Oracle Integration
The SDK triggers an Oracle request after a successful on-chain verification transaction. The Oracle verifies the transaction and issues a **SAS (Solana Attestation Service) Credential**.

## Resources
- [API Reference](API_REFERENCE.md): SDK types and helper functions.
