# API Reference

## solana-age-verify

### Core Functions

#### `verifyHost18Plus(options: VerifyHost18PlusOptions): Promise<VerifyResult>`

Main entry point for age verification. Runs liveness challenges and returns verification result.

**Parameters:**

```typescript
interface VerifyHost18PlusOptions {
  // Required: User's wallet public key (base58 encoded)
  walletPubkeyBase58: string;

  // Optional: HTML video element for camera feed
  videoElement?: HTMLVideoElement;
  
  // Optional: DOM element to mount UI overlay
  uiMountEl?: HTMLElement;
  
  // Optional: AbortSignal for cancellation
  signal?: AbortSignal;
  
  // Optional: Configuration overrides
  config?: Partial<VerifyConfig>;
  
  // Optional: Callback for challenge updates
  onChallenge?: (challenge: string) => void;

  // Optional: Callback when the worker is initialized
  onInitialized?: () => void;
  
  // Optional: Path to model files (default: '/models')
  modelPath?: string;
  
  // Required for stability: Custom worker factory
  workerFactory: () => Worker;

  // Optional: Dual-RPC failover URLs
  rpcUrls?: string | string[];

  // Optional: Shared RPC manager instance
  rpcManager?: RpcManager;

  // Optional: Direct connection override
  connection?: Connection;

  // Optional: Wallet for on-chain write
  wallet?: {
    publicKey: PublicKey;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
  };

  // Optional: App-specific treasury
  appTreasury?: string;

  // Optional: Override platform treasury
  platformTreasury?: string;

  // Optional: Sponsored transaction signer
  sponsor?: {
    publicKey: PublicKey;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
  };
}
```

**Returns:**

```typescript
interface VerifyResult {
  // Whether user passed 18+ verification
  over18: boolean;
  
  // Deterministic face hash (hex string)
  facehash: string;

  // Human-readable status description
  description: string;
  
  // ISO 8601 timestamp of verification
  verifiedAt: string;

  // Whether the 0.0005 SOL protocol fee was paid successfully
  protocolFeePaid: boolean;

  // The Solana Transaction ID for the protocol fee
  protocolFeeTxId?: string;

  // App-specific fee (if applicable)
  appFeePaid?: boolean;
  appFeeTxId?: string;

  // The specific reason for failure (e.g., age below threshold)
  failureReason?: string;
  
  // Detailed evidence
  evidence: {
    // Estimated age
    ageEstimate: number;

    // Estimated age from geometric heuristic (if available)
    ageEstimateGeometric?: number;

    // Estimated age from enhanced model (if available)
    ageEstimateEnhanced?: number;
    
    // Age estimation confidence (0-1)
    ageConfidence: number;
    
    // Active liveness score (0-1)
    livenessScore: number;
    
    // Passive surface integrity score (0-1)
    surfaceScore?: number;
    
    // Surface analysis features
    surfaceFeatures?: SurfaceFeatures;

    // Method used for age estimation ('standard' | 'enhanced' | 'unknown')
    ageMethod?: 'standard' | 'enhanced' | 'unknown';
    
    // Results for each challenge
    challenges: ChallengeResult[];
    
    // Model versions used
    modelVersions: Record<string, string>;
    
    // Cryptographic salt (hex)
    saltHex: string;
    
    // Session nonce (hex)
    sessionNonceHex: string;
  };
}
```

**Example:**

```typescript
import { verifyHost18Plus } from 'solana-age-verify';
import AgeWorker from 'solana-age-verify/dist/worker/worker.js?worker';

const video = document.getElementById('camera') as HTMLVideoElement;
const uiOverlay = document.getElementById('ui-overlay');

try {
  const result = await verifyHost18Plus({
    walletPubkeyBase58: wallet.publicKey.toBase58(),
    rpcUrls: [process.env.HELIUS_RPC!, process.env.QUICKNODE_RPC!],
    modelPath: '/models',
    uiMountEl: uiOverlay,
    workerFactory: () => new AgeWorker(),
    onChallenge: (challenge) => {
      console.log('Current challenge:', challenge);
    }
  });
  
  if (result.over18 && result.protocolFeePaid) {
    console.log('Verified! Hash:', result.facehash);
    console.log('Fee Tx ID:', result.protocolFeeTxId);
  } else {
    console.log('Verification failed or fee rejected');
  }
} catch (error) {
  console.error('Verification error:', error);
}
```

---

#### `createVerificationUI(): HTMLElement`

Creates a pre-styled UI overlay element for displaying verification progress.

**Returns:** `HTMLElement` - Div element with absolute positioning

**Example:**

```typescript
import { createVerificationUI, verifyHost18Plus } from 'solana-age-verify';
import AgeWorker from 'solana-age-verify/dist/worker/worker.js?worker';

const uiOverlay = createVerificationUI();
document.getElementById('video-container').appendChild(uiOverlay);

await verifyHost18Plus({
  walletPubkeyBase58: wallet.publicKey.toBase58(),
  connection: connection,
  wallet: wallet,
  uiMountEl: uiOverlay,
  workerFactory: () => new AgeWorker()
});
```

---

#### `RpcManager`

Advanced utility for managing multiple Solana connections with health monitoring and failover.

**Constructor:**
```typescript
new RpcManager(config: {
  endpoints: Array<{
    url: string;
    tags?: Array<'read' | 'tx' | 'default'>;
    weight?: number;
  }>;
  healthCheckInterval?: number; // default: 30000ms
});
```

**Key Methods:**
- `getConnection(tag?: string): Connection`: Get the best healthy connection for a specific feature tag.

### Configuration

#### `VerifyConfig`

```typescript
interface VerifyConfig {
  // List of challenges to perform (randomly generated if empty)
  challenges: ChallengeType[];
  
  // Minimum liveness score to pass (0-1)
  minLivenessScore: number;
  
  // Minimum age confidence to pass (0-1)
  minAgeConfidence: number;
  
  // Minimum estimated age to pass (18+)
  minAgeThreshold?: number;

  // Minimum surface integrity score to pass (0-1)
  minSurfaceScore: number;
  
  // Maximum time for entire verification (ms)
  timeoutMs: number;

  // Maximum consecutive failed attempts per session
  maxRetries: number;

  // Duration of security cooldown in minutes
  cooldownMinutes: number;
  
  // Protocol fee (SOL)
  protocolFeeSol?: number;

  // App fee (SOL)
  appFeeSol?: number;
  
  // Compute Unit Limit override (default: 150,000)
  computeUnitLimit?: number;

  telemetryUrl?: string;
  disableTelemetry?: boolean;
}
```

**Default Configuration:**

```typescript
const DEFAULT_CONFIG: VerifyConfig = {
  challenges: [], // Empty defaults to random sequence of 5
  minLivenessScore: 0.90,
  minAgeConfidence: 0.70,
  minAgeThreshold: 18,
  minSurfaceScore: 0.40,
  timeoutMs: 90000,
  maxRetries: 3,
  cooldownMinutes: 15,
  protocolFeeSol: 0.0005 // Protocol Fee (500,000 lamports)
};
```

**Challenge Types:**

```typescript
type ChallengeType = 
  | 'turn_left'    // Turn head left
  | 'turn_right'   // Turn head right
  | 'look_up'      // Look up
  | 'look_down'    // Look down
  | 'nod_yes'      // Nod head (up -> down or down -> up)
  | 'shake_no';    // Shake head (left -> right or right -> left)
```

**Custom Configuration Example:**

```typescript
await verifyHost18Plus({
  videoElement: video,
  walletPubkeyBase58: wallet.publicKey.toBase58(),
  config: {
    challenges: ['turn_left', 'turn_right', 'nod_yes'],
    minLivenessScore: 0.9,
    minAgeConfidence: 0.8,
    minAgeThreshold: 21, // For 21+ verification
    timeoutMs: 60000 // 1 minute
  }
});
```

---

### Utility Functions

#### `computeFaceHash(walletPubkey: string, salt: Uint8Array, embedding: number[]): Promise<string>`

Generates deterministic face hash from embedding.

**Location:** `packages/age-verify-sdk/src/hashing/facehash.ts`

**Parameters:**
- `walletPubkey`: Wallet public key (base58 string)
- `salt`: 16-byte random salt
- `embedding`: 128-dimensional face embedding

**Returns:** 64-character hex string

**Example:**

```typescript
import { computeFaceHash, generateSalt } from 'solana-age-verify';

const salt = generateSalt();
const embedding = [/* 128 numbers */];
const hash = await computeFaceHash(
  wallet.publicKey.toBase58(),
  salt,
  embedding
);
```

---

#### `generateSalt(): Uint8Array`

Generates cryptographically secure 16-byte random salt.

**Returns:** `Uint8Array` of length 16

---

#### `toHex(buffer: Uint8Array): string`

Converts byte array to hex string.

**Parameters:**
- `buffer`: Byte array

**Returns:** Hex string (lowercase)

---

### Face Descriptor

#### `TopoMapper.generate(landmarks: number[]): number[]`

Generates 128-dimensional geometric embedding from facial landmarks.

**Location:** `packages/age-verify-sdk/src/embedding/descriptor.ts`

**Parameters:**
- `landmarks`: Flat array of [x, y, z, x, y, z, ...] coordinates

**Returns:** 128-dimensional float array

**Example:**

```typescript
import { TopoMapper } from 'solana-age-verify';

const landmarks = [
  100, 150, 0,  // Right eye
  200, 150, 0,  // Left eye
  150, 200, 0,  // Nose
  150, 250, 0,  // Mouth
  50, 150, 0,   // Right ear
  250, 150, 0   // Left ear
];

const embedding = TopoMapper.generate(landmarks);
console.log(embedding.length); // 128
```

---

#### `TopoMapper.quantize(embedding: number[]): number[]`

Quantizes embedding to 3 decimal places for stability.

**Parameters:**
- `embedding`: Raw embedding array

**Returns:** Quantized embedding array

**Example:**

```typescript
const raw = TopoMapper.generate(landmarks);
const quantized = TopoMapper.quantize(raw);

// [1.23456789, 2.34567890, ...] -> [1.235, 2.346, ...]
```

---

## solana-age-verify (Worker Interface)

### Worker Interface

The worker is spawned automatically by the SDK. It communicates via message passing.

#### Request Messages

```typescript
type WorkerRequest = 
  | { type: 'LOAD_MODELS'; payload: { basePath: string } }
  | { type: 'PROCESS_FRAME'; payload: ImageData };
```

#### Response Messages

```typescript
type WorkerResponse = 
  | { type: 'LOADED' }
  | { type: 'RESULT'; payload: DetectionResult }
  | { type: 'ERROR'; error: string };
```

#### DetectionResult

```typescript
interface DetectionResult {
  faceFound: boolean;
  landmarks?: number[];      // Flat array [x,y,z,x,y,z,...]
  confidence?: number;        // 0-1
  ageEstimate?: number;       // 18-65
  ageEstimateGeometric?: number;
  ageEstimateEnhanced?: number;
  embedding?: number[];       // 128-D geometric embedding
  ageConfidence?: number;     // 0-1
  surfaceScore?: number;      // Passive liveness confidence (0-1)
  surfaceFeatures?: {         // Surface analysis details
    sh_a_score: number;
    ip_c_detected: boolean;
    sv_b_score: number;
    pr_d_pattern: 'natural' | 'artificial' | 'unknown';
  };
  ageMethod?: 'standard' | 'enhanced' | 'unknown';
}
```

---

## solana-age-verify (Registry Helpers)

### Functions

#### `getVerificationRecordPDA(programId: PublicKey, wallet: PublicKey): [PublicKey, number]`

Derives the Program Derived Address (PDA) for a user's verification record.

**Parameters:**
- `programId`: Age registry program ID
- `wallet`: User's wallet public key

**Returns:** `[PDA, bump]` tuple

**Example:**

```typescript
import { getVerificationRecordPDA } from 'solana-age-verify';

const [pda, bump] = getVerificationRecordPDA(
  program.programId,
  wallet.publicKey
);
```

---

#### `buildUpsertTx(...): Promise<Transaction>`

Builds a transaction to upsert a verification record on-chain.

**Parameters:**

```typescript
async function buildUpsertTx(
  program: anchor.Program,
  wallet: PublicKey,
  facehash: number[],      // 32 bytes
  salt: number[],          // 16 bytes
  verifiedAt: number,      // Unix timestamp (seconds)
  expiresAt: number,       // Unix timestamp (seconds)
  version: number          // Record version
): Promise<Transaction>
```

**Example:**

```typescript
import { buildUpsertTx } from 'solana-age-verify';

const result = await verifyHost18Plus({ ... });

if (result.over18) {
  const facehashBytes = Array.from(
    Buffer.from(result.facehash.slice(0, 64), 'hex')
  );
  const saltBytes = Array.from(
    Buffer.from(result.evidence.saltHex, 'hex')
  );
  
  const tx = await buildUpsertTx(
    program,
    wallet.publicKey,
    facehashBytes,
    saltBytes,
    Math.floor(Date.parse(result.verifiedAt) / 1000),
    Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
    1
  );
  
  const signature = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(signature);
}
```

---

#### `fetchCredential(connection: Connection, wallet: PublicKey): Promise<VerificationCredential>`

Fetches a user's verification record PDA from the blockchain. Use this to **fetch later** the verification (including `user_code`) for a given wallet—e.g. after a successful `createVerification` or when checking status without re-verifying.

**Returns:**

```typescript
interface VerificationCredential {
  over18: boolean;
  facehash: string;        // Hex string
  usercode: string;        // 5-digit alphanumeric
  verification_date: number; // Unix timestamp
  expiration: number;       // Unix timestamp
  bump: number;
}
```

**Example:**

```typescript
import { fetchCredential } from 'solana-age-verify';

try {
  const record = await fetchCredential(connection, wallet.publicKey);
  console.log('Verified at:', new Date(record.verification_date * 1000));
  console.log('Expires at:', new Date(record.expiration * 1000));
} catch (error) {
  console.log('No verification record found');
}
```

---

### 🛰️ Oracle API

The Oracle Service provides a secure bridge between client-side verification results and optional on-chain SAS attestations.

### `POST /api/sign-verification`

Signs a verification transaction with the platform wallet so the client never sees the platform private key.

**Request Body**:
```json
{
  "serializedTx": "string (base64 serialized legacy or v0 transaction)"
}
```

**Response (Success)**:
```json
{
  "transaction": "string (base64 signed tx)",
  "platformPublicKey": "string (Base58 Public Key)",
  "isV0": true
}
```

**Response (Error)**:
```json
{
  "error": "string (Error message)",
  "message": "string (Diagnostic detail)"
}
```

### `POST /api/issue-credential`

Used to trigger SAS credential issuance after a successful on-chain verification transaction.

**Server environment (required for Oracle)**:
- `HELIUS_RPC_URL` or `VITE_HELIUS_RPC_URL` – primary RPC for reads
- `QUICKNODE_RPC_URL` or `VITE_QUICKNODE_RPC_URL` – transaction RPC (optional if same as primary)
- `ISSUER_SECRET_KEY` – JSON array of issuer keypair bytes
- `CREDENTIAL_ADDRESS` – SAS credential account pubkey
- `SCHEMA_ADDRESS` – SAS schema account pubkey

**Request Body**:
```json
{
  "signature": "string (Solana Transaction ID)",
  "wallet": "string (Base58 Public Key)"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "attestation": "string (Attestation PDA Address)",
  "message": "SAS credential issued successfully",
  "issued_at": 1737049200,
  "expires_at": 1744825200
}
```

**Response (Error)**:
```json
{
  "error": "string (Error message)",
  "details": "string (Stack trace - development only)"
}
```

**Endpoint URL**: `https://ageverify.live/api/issue-credential` (Production)

### `POST /api/sdk-events`

Optional telemetry endpoint for SDK performance and error events (if enabled).

**Request Body**:
```json
{
  "event": "string",
  "payload": "object"
}
```

**Response (Success)**:
```json
{
  "ok": true
}
```

## Error Handling

### Common Errors

```typescript
} catch (error) {
  if (error.message.includes('Cooldown active')) {
    // User is in security cooldown after too many failures
  } else if (error.message === 'Timeout') {
    // User took too long
  } else if (error.message === 'Aborted') {
    // User cancelled
  } else if (error.message.includes('Worker')) {
    // Model loading or inference failed
  } else if (error.message.includes('camera')) {
    // Camera access denied
  }
}
```

### Cancellation

```typescript
const controller = new AbortController();

// Start verification
const promise = verifyHost18Plus({
  videoElement: video,
  walletPubkeyBase58: wallet.publicKey.toBase58(),
  signal: controller.signal
});

// Cancel after 30 seconds
setTimeout(() => controller.abort(), 30000);

try {
  await promise;
} catch (error) {
  console.log('Cancelled:', error.message === 'Aborted');
}
```

---

## TypeScript Types

All types are exported from the main package:

```typescript
import type {
  VerifyHost18PlusOptions,
  VerifyResult,
  VerifyConfig,
  ChallengeType,
  ChallengeResult,
  DetectionResult,
  SurfaceFeatures,
  AgeMethod
} from 'solana-age-verify';
```

---

## Browser Compatibility

- **Chrome/Edge**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (iOS 14.5+)
- **Opera**: ✅ Full support

**Requirements:**
- WebRTC (camera access)
- WebGL or WebAssembly (for TFJS)
- WebCrypto API (for hashing)
- Web Workers

---

## Performance Tips

1. **Preload Models**: Call `verifyHost18Plus` once to cache models
2. **Reuse Video Element**: Don't recreate the video element between verifications
3. **Use WebGL Backend**: Ensure TFJS uses WebGL for best performance
4. **Optimize Camera Resolution**: 640x480 is sufficient, higher resolutions slow down inference

```typescript
// Set camera constraints
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'user'
  }
});
video.srcObject = stream;
```
