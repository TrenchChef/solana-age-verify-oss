# Solana Age Verify


**Verify users as 18+ on-chain. Privacy-safe, no ID needed, run entirely in the browser.**

## What is Solana Age Verify?

**Solana Age Verify** is a high-performance, privacy-preserving biometric identity primitive built specifically for the Solana ecosystem. It enables developers to gate content or services based on age (>18) without ever handling, storing, or seeing raw facial data. 

It records a lightweight on-chain verification record (PDA) and triggers SAS attestation, providing a composable, cost-effective "KYC-lite" layer for the next generation of regulated or age-restricted dApps.

## Why Developers Choose Solana Age Verify

Integrate institutional-grade age verification in under 5 minutes with a simple React-friendly SDK.

Privacy-safe, on-chain, and run entirely in the browser: no passports, no IDs, no credit cards. Just a face scan and a wallet signature.

- **Developer Velocity**: Integrate institutional-grade age verification in under 5 minutes with a simple React-friendly SDK.
- **Privacy-First Biometrics**: Neural inference is performed entirely in the browser. No images or videos ever leave the user's device.
- **On-Chain PDA Record**: Verification records are stored as deterministic PDAs in the `age_registry` program.
- **Composable Identity**: On-chain records are readable by any protocol; SAS attestations provide portability across dApps.
- **Sybil Resistance**: Generates a deterministic **FaceHash** linked to the user's wallet, preventing multi-account abuse without exposing personal identity.
- **Premium Aesthetics**: A glassmorphic HUD that elevates the UX of your dApp.

## Age Verify vs. Traditional KYC

| Feature | Solana Age Verify | Traditional KYC |
| :--- | :--- | :--- |
| **Verification Speed** | 10-20 Seconds | 2+ Days |
| **User Data Storage** | Zero (Local RAM Only) | Centralized PII Databases |
| **Storage Technology** | PDA account (standard Solana account) | Standard On-Chain or DB |
| **Privacy Level** | On-device biometrics + on-chain result | Full Identity Disclosure |
| **User Friction** | No IDs/Cards Needed | Passport/Selfie/Bills |
| **Base Protocol Fee** | 0.0009 SOL (~$0.18) | $5.00 - $15.00+ |
| **Registry Standard** | Program PDA + SAS | Siloed Proprietary API |

## Technical Architecture

The SDK handles a multi-stage verification and attestation flow:

### 1. Biometric Analysis (Local)
- **Sensor-D**: High-speed face detection and landmark localization.
- **Primary Logic Engine**: Multi-stage classification for age estimation and liveness (`tl_runtime.ts`).
- **Surface Integrity Analysis**: Passive liveness detection targeting digital recaptures and spoofs.

### 2. On-Chain Recording (PDA)
The SDK constructs an **Anchor Instruction** for the `age_registry` program.
- **Deterministic PDA**: Addresses are derived from `[b"verification", user_pubkey]`.
- **Standard Writes**: No ZK compression or gatekeeper co-signature required.

### 3. Attestation Issuance (SAS Oracle)
Once the verification record is anchored to the Solana ledger:
- An **Oracle** service monitors the registry for new records.
- After confirmation, the Oracle issues a **Solana Attestation Service (SAS)** verifiable credential.
- This credential can be queried cross-platform, allowing users to "Verify Once, Use Everywhere."

## Security Architecture

1. **Client-Side AI**: Neural inference (WASM) runs locally in a Web Worker. Biometric signatures stay in the browser.
2. **On-Chain Record**: The SDK writes a verification record PDA anchored to the user's wallet.
3. **Credential Issuance**: The Platform Oracle monitors the chain and issues a standard SAS credential.
5. **Deterministic FaceHash**: A non-reversible hash representing a unique human identity without storing identifiable features.


## Installation

```bash
npm install solana-age-verify
# or
yarn add solana-age-verify
```

## Requirements

1. **Vite / Webpack**: Your bundler must support Worker imports.
2. **Static Assets**: The SDK relies on WASM and logic binary files (`tl_v1.bin`) that must be served from your public directory.
3. **Anchor Context**: For on-chain recording, a standard Solana Connection and Wallet Adapter are required.

### Serving Static Assets (Critical)

You must copy the component files from the package to your public folder.

**For Vite:**
Install `vite-plugin-static-copy`:

```bash
npm install -D vite-plugin-static-copy
```

Update `vite.config.ts`:

```typescript
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/solana-age-verify/public/models/*',
          dest: 'models' // Available at /models
        },
        {
          // NOTE: in pnpm or monorepos, onnxruntime-web may be hoisted outside
          // the app's node_modules. Use a resolved path or a fallback search.
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: '.' // Required for the logic runtime
        }
      ]
    })
  ]
});
```

If you see a build warning like "No file was found to copy on node_modules/onnxruntime-web/dist/*.wasm",
use a resolved path instead of a hardcoded string:

```typescript
import { createRequire } from 'module';
import path from 'path';
const require = createRequire(import.meta.url);
const onnxEntry = require.resolve('onnxruntime-web');
const wasmDir = path.dirname(onnxEntry);

// Then use:
// src: normalizePath(path.join(wasmDir, '*.wasm'))
```

## Usage

### 1. Initialize the Secure Web Worker

The SDK performs intensive biometric analysis in a background Web Worker.

```typescript
import { verifyHost18Plus } from 'solana-age-verify';
import AgeWorker from 'solana-age-verify/worker?worker'; 

const handleVerify = async () => {
    const result = await verifyHost18Plus({
        walletPubkeyBase58: publicKey.toBase58(),
        connection: connection,
        wallet: {
            publicKey: publicKey,
            signTransaction: signTransaction
        },
        workerFactory: () => new AgeWorker(),
        uiMountEl: document.getElementById('verification-mount'),
        appTreasury: "YOUR_SOLANA_WALLET_ADDRESS",
        appFeeSol: 0.001
    });

    if (result.over18) {
        console.log("Verified! Credential Address:", result.facehash);
        console.log("Signature:", result.protocolFeeTxId);
    }
}
```

## API Reference

### `verifyHost18Plus(options)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `walletPubkeyBase58` | `string` | Yes | The user's wallet public key string. |
| `connection` | `Connection` | Yes* | Solana web3.js Connection object. |
| `wallet` | `WalletAdapter` | Yes* | Object containing `publicKey` and `signTransaction`. |
| `workerFactory` | `() => Worker` | Yes | Function returning a new Worker instance. |
| `uiMountEl` | `HTMLElement` | No | Container element to mount the glassmorphic HUD. |
| `modelPath` | `string` | No | Path to binary logic files. Defaults to `/models`. |
| `appFeeSol` | `number` | No | Additional fee paid to the host application. |
| `appTreasury` | `string` | No* | Wallet to receive `appFeeSol`. |
| `config` | `VerifyConfig` | No | Override default security thresholds. |

*\*On-chain features are disabled if omitted.*

### Configuration Options (`VerifyConfig`)

```typescript
{
    minLivenessScore: 0.90,    // High-precision liveness threshold
    minAgeConfidence: 0.70,    // Diagnostic confidence requirement
    minSurfaceScore: 0.40,     // Surface integrity sensitivity
    minAgeThreshold: 18,       // Minimum target age
    timeoutMs: 90000           // Timeout for the verification session
}
```

### Return Value (`VerifyResult`)

```typescript
interface VerifyResult {
    over18: boolean;           // Whether the user passed all checks
    facehash: string;          // Non-reversible FaceHash
    userCode: string;          // 5-digit Base34 User Code
    protocolFeeTxId?: string;  // Solana Transaction ID
    description: string;       // Result summary or failure reason
    evidence: {
        ageEstimate: number;
        ageConfidence: number;
        livenessScore: number;
        surfaceScore: number;
        ageMethod: 'standard' | 'enhanced' | 'unknown';
        challenges: ChallengeResult[];
    }
}
```

## Verification Status & Credentials

To check if a user is already verified (via the on-chain PDA record and SAS) without re-running the biometric check:

```typescript
import { checkVerificationStatus, fetchCredential } from 'solana-age-verify';

// 1. Check for valid on-chain transaction & FaceHash
const status = await checkVerificationStatus(connection, userPublicKey);

// 2. Fetch full verification record metadata (PDA)
const credential = await fetchCredential(connection, userPublicKey);

if (status.isVerified && credential) {
    console.log(`User confirmed: ${credential.over18 ? '18+' : 'Under 18'}`);
    console.log(`Expires: ${new Date(credential.expiration).toLocaleDateString()}`);
}
```

## License

MIT
