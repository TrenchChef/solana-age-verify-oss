# Face Hash System Documentation

## Overview

The **Face Hash** system provides a **deterministic, privacy-preserving unique identifier** for each verified user. It combines geometric facial features with cryptographic hashing to create a stable, non-reversible identifier that can be used for:

- **Sybil Resistance**: Preventing the same person from creating multiple verified accounts
- **Privacy**: No biometric data is stored or transmitted - only the hash
- **Auditability**: Results can be written to blockchain/database with verifiable timestamps
- **User Codes**: Derives a short, human-readable 5-digit code (e.g., `XP79K`) for manual lookups

## Architecture

```
┌─────────────┐
│   Camera    │
│   Frames    │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│  MediaPipe Face Detector     │
│  (TFJS) Detection (6 points) │
└──────────────┬───────────────┘
       │
       ▼
┌─────────────────┐
│   TopoMapper    │
│  Generate 128-D │
│  Embedding      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Quantization   │
│  (3 decimals)   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  computeFaceHash│
│  SHA-256        │
│  (wallet+salt+  │
│   embedding)    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   64-char Hex   │
│   Face Hash     │
└─────────────────┘
```

## Components

### 1. Face Detection (MediaPipe Face Detector via TFJS)

**Location**: `packages/age-verify-sdk/src/adapters/vs_core.ts`

- Uses the TFJS MediaPipe Face Detector runtime (`@tensorflow-models/face-detection`)
- Detects 6 key facial landmarks:
  - Right Eye (index 0)
  - Left Eye (index 1)
  - Nose Tip (index 2)
  - Mouth Center (index 3)
  - Right Ear (index 4)
  - Left Ear (index 5)
- Each landmark has (x, y, z) coordinates

### 2. Embedding Generation (TopoMapper)

**Location**: `packages/age-verify-sdk/src/embedding/descriptor.ts`

Generates a **128-dimensional geometric feature vector** from the 6 landmarks.

#### Feature Components:

1. **Normalized Coordinates** (18 features)
   - All 6 landmarks normalized relative to face center and inter-eye distance
   - Scale-invariant and translation-invariant

2. **Pairwise Distances** (15 features)
   - Euclidean distances between all unique pairs of landmarks
   - Captures relative spatial relationships

3. **Angular Features** (5 features)
   - Eye-to-nose angles (left & right)
   - Nose-to-mouth angle
   - Eye-to-ear angles (left & right)
   - Captures face orientation and structure

4. **Geometric Ratios** (4 features)
   - Eye spacing / face width
   - Face height / face width
   - Nose position ratio
   - Mouth position ratio

5. **Symmetry Features** (1 feature)
   - Left side width / right side width
   - Detects facial asymmetry

6. **Derived Features** (85 features)
   - Deterministic polynomial transformations
   - Pads to exactly 128 dimensions

#### Quantization

```typescript
TopoMapper.quantize(embedding)
```

- Rounds each dimension to **3 decimal places**
- Reduces noise from minor variations (head tilt, camera shake)
- Ensures same face produces same embedding across sessions

### 3. Cryptographic Hashing

**Location**: `packages/age-verify-sdk/src/hashing/facehash.ts`

```typescript
computeFaceHash(
  walletPubkeyBase58: string,
  salt: Uint8Array,           // 16 random bytes
  embedding: number[]          // 128-D quantized embedding
): Promise<string>
```

#### Hash Input Construction:

```
┌──────────────────────────────────────────────────┐
│  Prefix: "solana-verify:v1"                      │
├──────────────────────────────────────────────────┤
│  Wallet Public Key (UTF-8 bytes)                 │
├──────────────────────────────────────────────────┤
│  Salt (16 bytes)                                 │
├──────────────────────────────────────────────────┤
│  Embedding (128 × 4 = 512 bytes as Float32Array)│
└──────────────────────────────────────────────────┘
         │
         ▼
    SHA-256
         │
         ▼
  64-character hex string
```

#### Properties:

- **Deterministic**: Same face + same wallet + same salt = same hash
- **Unique**: Different faces produce different hashes (high probability)
- **Non-reversible**: Cannot recover face data from hash
- **Wallet-bound**: Hash is specific to the user's wallet address
- **Salted**: Prevents rainbow table attacks

## Usage Example

```typescript
import { verifyHost18Plus } from 'solana-age-verify';

const result = await verifyHost18Plus({
  videoElement: document.getElementById('video'),
  walletPubkeyBase58: userWallet.publicKey.toBase58(),
  modelPath: '/models'
});

if (result.over18) {
  console.log('Face Hash:', result.facehash);
  // facehash: "a3f2e1d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2..."
  
  console.log('Timestamp:', result.verifiedAt);
  // verifiedAt: "2025-12-29T19:45:05.123Z"
  
  console.log('Evidence:', result.evidence);
  // evidence: {
  //   ageEstimate: 25,
  //   ageConfidence: 0.92,
  //   livenessScore: 1.0,
  //   saltHex: "a1b2c3d4e5f6...",
  //   sessionNonceHex: "f6e5d4c3b2a1..."
  // }
}
```

## Writing to Blockchain

```typescript
import { buildUpsertTx } from 'solana-age-verify';

// Convert hex salt to byte array
const saltBytes = Buffer.from(result.evidence.saltHex, 'hex');

// Convert facehash to 32-byte array (first 32 bytes of hash)
const facehashBytes = Array.from(
  Buffer.from(result.facehash.slice(0, 64), 'hex')
);

const tx = await buildUpsertTx(
  program,
  userWallet.publicKey,
  facehashBytes,
  Array.from(saltBytes),
  Date.parse(result.verifiedAt),
  Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year expiry
  1 // version
);

await wallet.sendTransaction(tx, connection);
```

## Security Considerations

### Strengths

✅ **Privacy-Preserving**: No raw biometric data leaves the browser  
✅ **Deterministic**: Same person = same hash (for sybil resistance)  
✅ **Non-Reversible**: Cannot reconstruct face from hash  
✅ **Wallet-Bound**: Hash is tied to specific wallet address  
✅ **Salted**: Prevents precomputation attacks  

### Limitations

⚠️ **Not Deep Learning**: This is a geometric descriptor, not a FaceNet-style embedding  
⚠️ **Stability**: Significant facial changes (surgery, aging) may produce different hashes  
⚠️ **Spoofing**: Relies on liveness detection to prevent photo/video attacks  
⚠️ **Collision Risk**: Theoretical (but extremely low) chance of hash collision  

## Determinism Guarantees

The system is **strictly deterministic** at every layer:

1. **Landmark Detection**: BlazeFace produces consistent (x,y,z) coordinates for the same face
2. **Embedding Generation**: Pure function - same landmarks → same embedding
3. **Quantization**: Rounds to 3 decimals - reduces noise while maintaining uniqueness
4. **Hashing**: SHA-256 is deterministic - same input → same output

### Testing Determinism

```typescript
// Run verification twice with same user
const result1 = await verifyHost18Plus({ ... });
const result2 = await verifyHost18Plus({ ... });

// Same salt must be used for determinism test
assert(result1.facehash === result2.facehash);
```

## Performance

- **Embedding Generation**: < 1ms (pure JavaScript)
- **SHA-256 Hashing**: < 1ms (WebCrypto API)
- **Total Overhead**: Negligible compared to face detection (~50ms per frame)

## Version History

- **v2.1** (Current): 128-D geometric descriptor with SHA-256 (SDK v2.1.0)
  - Prefix: `"talkchain-verify:v1"` (Hash generation logic maintained for device consistency)
  - Future versions may use different embedding models or hash algorithms

## FAQ

**Q: Can the same person get different hashes?**  
A: Only if they use a different wallet address. The hash is wallet-bound.

**Q: What if someone changes their appearance?**  
A: Minor changes (makeup, glasses) are tolerated due to quantization. Major changes (surgery) may produce a different hash.

**Q: Is this as good as FaceNet?**  
A: No. This is a lightweight geometric descriptor for uniqueness, not a deep learning embedding for recognition.

**Q: Can I use this for face recognition?**  
A: No. This is for generating unique IDs, not for matching faces across databases.

**Q: What's the collision probability?**  
A: Extremely low. SHA-256 has 2^256 possible outputs. Geometric embedding provides ~2^128 unique inputs.

## References

- [BlazeFace Model](https://github.com/tensorflow/tfjs-models/tree/master/face-detection)
- [SHA-256 Specification](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf)
- [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)
