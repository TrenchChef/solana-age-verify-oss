# Quick Start Guide


Integrate Solana Age Verify into your application in under 5 minutes.

## 1. Install

```bash
# Using npm
npm install solana-age-verify

# Using pnpm
pnpm add solana-age-verify
```

### Prerequisite: High-Availability RPC
For maximum reliability, we recommend providing at least two RPC endpoints for failover (e.g., a primary + a backup).
```bash
VITE_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=<YOUR_KEY>
VITE_QUICKNODE_RPC=https://<YOUR_NAME>.solana-mainnet.quiknode.pro/<YOUR_KEY>/
```

## 2. Host Models

The SDK requires the following files in your `public/models` folder:
- `m_01_w.json`, `m_01_s1.bin` (Age/Gender)
- `m_02_w.json`, `m_02_s1.bin` (Landmarks)
- `m_03_w.json`, `m_03_s1.bin`, `m_03_s2.bin` (Recognition)
- `m_04_w.json`, `m_04_s1.bin` (Detection)
- `m_05.bin` (Liveness)
- `ort-wasm-simd-threaded.wasm` (+ jsep, asyncify)

You can find these in `node_modules/solana-age-verify/public/models`.

```bash
cp -r node_modules/solana-age-verify/public/models public/
```

## 3. Basic Usage (React)

```tsx
import { verifyHost18Plus } from 'solana-age-verify';
import { Connection } from '@solana/web3.js';
import { useRef, useState } from 'react';
// Import your worker (browser-specific)
import AgeWorker from 'solana-age-verify/dist/worker/worker.js?worker';

export function VerifyButton({ wallet, connection }: { wallet: any, connection: Connection }) {
  const [verifying, setVerifying] = useState(false);
  const hudRef = useRef<HTMLDivElement>(null);

  const startVerify = async () => {
    setVerifying(true);
    try {
      const result = await verifyHost18Plus({
        walletPubkeyBase58: wallet.publicKey.toBase58(),
        rpcUrls: [import.meta.env.VITE_HELIUS_RPC!, import.meta.env.VITE_QUICKNODE_RPC!],
        wallet,
        uiMountEl: hudRef.current!,
        modelPath: '/models',
        workerFactory: () => new AgeWorker() // Required for stability
      });

      if (result.over18 && result.protocolFeePaid) {
        alert("Verified! Face Hash: " + result.facehash);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={startVerify} disabled={verifying}>
        {verifying ? "Verifying..." : "Verify Age 18+"}
      </button>
      
      {/* HUD Container */}
      <div ref={hudRef} style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }} />
    </div>
  );
}
```

## 4. Key Features

- **Built-in UI**: Premium glassmorphism HUD included.
- **Monetization Built-in**: Protocol fee + optional app fee handled automatically.
- **Liveness Detection**: Anti-spoofing via "Nod" and "Shake" challenges.
- **Privacy First**: No face data ever leaves the user's browser.
- **SAS Integrated**: Oracle issues a Solana Attestation Service credential after on-chain verification.
- **PDA Record**: Verification state is stored in a deterministic on-chain PDA.
- **Deterministic**: Generates a stable Face Hash & User Code.

## Next Steps

- [SDK Integration Guide](INTEGRATION_GUIDE.md)
- [Solana Registry Docs](https://github.com/TrenchChef/solana-age-registry)
- [API Reference](API_REFERENCE.md)
