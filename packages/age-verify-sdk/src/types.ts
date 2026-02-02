import { Connection, PublicKey, Transaction } from '@solana/web3.js';

/** Age Registry program ID. */
export const AGE_REGISTRY_PROGRAM_ID = new PublicKey('AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q');

const USER_CODE_CHARSET = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789';

export interface VerificationRecordData {
    bump: number;
    userCode: string;
    facehash: string;
    verifiedAt: number;
    expiresAt: number;
    over18: boolean;
}

export function deriveVerificationPda(
    walletPubkey: PublicKey,
    programId: PublicKey = AGE_REGISTRY_PROGRAM_ID
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('verification'), walletPubkey.toBuffer()],
        programId
    );
}

export function deriveUserCodeFromPda(pda: PublicKey): string {
    const bytes = pda.toBytes();
    const codeChars: string[] = [];
    for (let i = 0; i < 5; i += 1) {
        const byte = bytes[i] ^ bytes[i + 5];
        const idx = byte % USER_CODE_CHARSET.length;
        codeChars.push(USER_CODE_CHARSET[idx]);
    }
    return codeChars.join('');
}

export function parseVerificationRecord(data: Buffer): VerificationRecordData {
    let offset = 8; // Anchor discriminator

    // facehash: [u8; 32]
    const facehash = data.slice(offset, offset + 32).toString('hex');
    offset += 32;

    // user_code: String
    const codeLen = data.readUInt32LE(offset);
    offset += 4;
    const userCode = data.slice(offset, offset + codeLen).toString();
    offset += codeLen;

    // over_18: bool
    const over18 = data.readUInt8(offset) === 1;
    offset += 1;

    // verified_at: i64
    const verifiedAt = Number(data.readBigInt64LE(offset));
    offset += 8;
    // expires_at: i64
    const expiresAt = Number(data.readBigInt64LE(offset));
    offset += 8;

    // bump: u8
    const bump = data.readUInt8(offset);

    return {
        bump,
        userCode,
        facehash,
        verifiedAt,
        expiresAt,
        over18
    };
}

export interface VerifyHost18PlusOptions {
    walletPubkeyBase58: string;
    videoElement?: HTMLVideoElement;
    uiMountEl?: HTMLElement;
    instructionElement?: HTMLElement;
    signal?: AbortSignal;
    config?: Partial<VerifyConfig>;
    onChallenge?: (challenge: string) => void;
    onInitialized?: () => void;
    modelPath?: string;
    workerFactory?: () => Worker;
    appTreasury?: string; // App-specific treasury (e.g. TalkChain)
    platformTreasury?: string; // Optional override for platform protocol treasury
    // Payment and RPC integration
    connection?: Connection;
    rpcManager?: unknown; // RpcManager from internal rpc/manager
    rpcUrls?: string | string[];
    wallet?: {
        publicKey: PublicKey;
        signTransaction: (tx: Transaction) => Promise<Transaction>;
    };
    sponsor?: {
        publicKey: PublicKey;
        signTransaction: (tx: Transaction) => Promise<Transaction>;
    };
}

export interface VerifyConfig {
    challenges: string[];
    minLivenessScore: number;
    minAgeConfidence: number;
    /**
     * Minimum age required to pass verification.
     * Default: 18
     */
    minAgeThreshold?: number;
    timeoutMs: number;
    maxRetries: number;
    cooldownMinutes: number;
    protocolFeeSol?: number;
    appFeeSol?: number;
    minSurfaceScore: number; // Obscured: Surface integrity threshold
    telemetryUrl?: string;
    disableTelemetry?: boolean;
}

export const DEFAULT_CONFIG: VerifyConfig = Object.freeze({
    challenges: [],
    minLivenessScore: 0.90, // Increased from 0.85
    minAgeConfidence: 0.70, // Increased from 0.65
    minAgeThreshold: 18,
    minSurfaceScore: 0.40, // Obscured Surface Sensitivity
    timeoutMs: 90000,
    maxRetries: 3,
    cooldownMinutes: 15,
    disableTelemetry: false,
    protocolFeeSol: 0.0005
});

export interface ChallengeResult {
    type: string;
    passed: boolean;
    score: number;
}

export type AgeMethod = 'standard' | 'enhanced' | 'unknown';

export interface VerifyResult {
    over18: boolean;
    facehash: string;
    description: string;
    verifiedAt: string; // ISO
    protocolFeePaid?: boolean;
    protocolFeeTxId?: string;
    appFeePaid?: boolean;
    appFeeTxId?: string;
    evidence: {
        ageEstimate: number;
        ageEstimateGeometric?: number;
        ageEstimateEnhanced?: number;
        ageConfidence: number;
        livenessScore: number;
        // Legacy integrity tokens preserved for protocol consistency
        sh_a_score?: number;
        surfaceScore?: number;
        surfaceFeatures?: SurfaceFeatures;
        ageMethod?: AgeMethod;
        challenges: ChallengeResult[];
        modelVersions: Record<string, string>;
        saltHex: string;
        sessionNonceHex: string;
    };
    referralCode?: string; // Legacy 4-char
    userCode?: string;     // New 5-digit Base34 code
    bump?: number;         // SAS-compatibility
    verifiedAtUnix?: number;
}

export interface FrameData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    timestamp: number;
}

export interface WorkerResponse {
    type: 'RESULT' | 'ERROR' | 'LOADED';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
    error?: string;
}

export interface WorkerRequest {
    type: 'PROCESS_FRAME' | 'LOAD_MODELS';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
}

export interface SurfaceFeatures {
    sh_a_score: number;
    ip_c_detected: boolean;
    sv_b_score: number;
    pr_d_pattern: 'natural' | 'artificial' | 'unknown';
}

export interface DetectionResult {
    faceFound: boolean;
    landmarks?: number[]; // mixed flat array
    ageEstimate?: number;
    ageEstimateGeometric?: number;
    ageEstimateEnhanced?: number;
    embedding?: number[];
    confidence?: number;
    surfaceScore?: number;
    surfaceFeatures?: SurfaceFeatures;
    ageConfidence?: number;
    ageMethod?: AgeMethod;
}

export interface SensorInterface {
    load(basePath?: string): Promise<void>;
    detect(frame: ImageData | HTMLCanvasElement | OffscreenCanvas): Promise<DetectionResult>;
}
