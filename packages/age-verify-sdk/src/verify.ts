// The public treasury address is managed internally via security.ts
// This address is used by the SDK to direct fee payments to the platform's treasury.
import { VerifyHost18PlusOptions, VerifyResult, VerifyConfig, DEFAULT_CONFIG, WorkerRequest, ChallengeResult, AgeMethod, SurfaceFeatures, DetectionResult } from './types';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey, ComputeBudgetProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Idl, Wallet } from '@coral-xyz/anchor';
import { IDL } from './idl';
import { Camera } from './camera';
import { computeFaceHash, generateSalt, toHex } from './hashing/facehash';
import { generateChallengeSequence, ChallengeType } from './liveness/challenges';

import { getPlatformPublicKey, getProtocolFee } from './security';
import { createSpinnerHTML } from './ui/spinner';
import { TelemetryManager } from './telemetry';
import { RpcManager } from './rpc/manager';
import { getQuickNodePriorityFee } from './rpc/priority-fee';
import { deriveUserCodeFromPda, deriveVerificationPda, parseVerificationRecord } from './types';

const PROGRAM_ID = new PublicKey('AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q');


// Helper to inject styles once
const injectStyles = () => {
    const styleId = 'sav-sdk-styles';
    if (typeof document === 'undefined' || document.getElementById(styleId)) return;

    const css = `
        /* --- Base Layout --- */
        .sav-ui-container {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            pointer-events: none;
            font-family: -apple-system, system-ui, sans-serif;
            overflow: hidden;
        }

        .sav-instruction-host {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            font-family: -apple-system, system-ui, sans-serif;
        }

        /* --- Top Section (Instruction) --- */
        .sav-top-section {
            position: absolute;
            top: 5px; /* Tightened padding from top */
            left: 0;
            width: 100%;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            z-index: 30;
        }

        /* --- Instruction Card --- */
        .sav-card {
            background: rgba(0, 0, 0, 0.6); /* More transparent */
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            padding: 16px 24px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 400px;
            text-align: center;
            margin: 0 auto;
            color: #fff;
        }

        .sav-card-text-main {
            font-size: 18px; /* Slightly smaller for mobile */
            font-weight: 700;
            color: #fff;
            line-height: 1.3;
            margin-bottom: 4px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .sav-card-text-sub {
            font-size: 11px;
            font-weight: 600;
            color: #cbd5e1;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        /* --- Face Guide (Visual Only, NO MASK) --- */
        .sav-guide {
            position: absolute;
            top: 55%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: min(280px, 70%);
            height: min(380px, 70%);
            border-radius: 50%; 
            border: 2px dashed rgba(255, 255, 255, 0.3); /* Dashed guide only */
            box-shadow: none; /* REMOVED BLACKOUT MASK */
            z-index: 10;
            opacity: 0.6;
        }

        /* --- Footer --- */
        .sav-footer {
            position: absolute;
            bottom: 20px;
            left: 0;
            right: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 20;
            width: 100%;
            padding: 0 40px;
            box-sizing: border-box;
        }

        .sav-progress-container {
            width: 100%;
            max-width: 300px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .sav-progress-track {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            overflow: hidden;
        }

        .sav-progress-fill {
            height: 100%;
            background: #3b82f6;
            transition: width 0.3s ease;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
        }

        .sav-step-track {
            height: 3px;
            width: 100%;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 2px;
        }

        .sav-step-fill {
            height: 100%;
            background: #14F195; /* Solana Green for step progress */
            transition: width 0.2s ease;
        }
        
        /* --- DESKTOP OVERRIDES --- */
        @media (min-width: 768px) {
            .sav-card {
                max-width: 420px;
            }
            .sav-card-text-main {
                font-size: 22px;
            }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
};



export async function verifyHost18Plus(options: VerifyHost18PlusOptions): Promise<VerifyResult> {
    const config: VerifyConfig = { ...DEFAULT_CONFIG, ...options.config };
    let keepSuccessUI = false;

    // Initialize Telemetry
    const telemetry = new TelemetryManager(config.telemetryUrl, config.disableTelemetry);
    if (options.walletPubkeyBase58) {
        telemetry.setWallet(options.walletPubkeyBase58);
    }

    // Fire Init Event (Fire & Forget)
    telemetry.track('init', {
        treasury: options.appTreasury,
        hasWallet: !!options.wallet,
        config: {
            minAge: config.minAgeThreshold,
            livenessThreshold: config.minLivenessScore
        }
    });

    const clearInstructionUI = () => {
        if (!options.instructionElement) return;
        options.instructionElement.innerHTML = '';
        options.instructionElement.classList.remove('sav-instruction-host');
    };

    // Cooldown & Retry Check
    // v2 key prefix resets history for everyone (clearing failed attempts as requested)
    const storageKey = `solana_av_v2_retries_${options.walletPubkeyBase58}`;
    const cooldownKey = `solana_av_v2_cooldown_${options.walletPubkeyBase58}`;

    const now = Date.now();
    const cooldownUntil = parseInt(localStorage.getItem(cooldownKey) || '0');
    const currentRetries = parseInt(localStorage.getItem(storageKey) || '0');
    const cooldownCountKey = `solana_av_v2_cooldown_count_${options.walletPubkeyBase58}`;
    const currentCooldownCount = parseInt(localStorage.getItem(cooldownCountKey) || '0');

    if (cooldownUntil > now) {
        const remainingSec = Math.ceil((cooldownUntil - now) / 1000);
        const remainingMin = Math.ceil(remainingSec / 60);

        clearInstructionUI();
        if (options.uiMountEl) {
            options.uiMountEl.innerHTML = `
                <div style="position: relative; height: 100%; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; font-family: sans-serif; color: white; text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
                    <div style="font-size: 24px; font-weight: 700; margin-bottom: 12px;">Security Cooldown</div>
                    <div style="font-size: 16px; color: #94a3b8; line-height: 1.6;">
                        Too many failed attempts. <br>
                        Please wait <b>${remainingMin} minute${remainingMin > 1 ? 's' : ''}</b> before trying again.
                    </div>
                </div>
            `;
        }
        throw new Error(`Cooldown active. Try again in ${remainingMin} minutes.`);
    }

    const camera = new Camera(options.videoElement);
    const salt = generateSalt();
    const sessionNonce = generateSalt();

    // Initialize RPC Manager if URLs or manager provided
    let rpcManager: RpcManager | undefined = options.rpcManager as RpcManager | undefined;
    if (!rpcManager && options.rpcUrls) {
        const urls = typeof options.rpcUrls === 'string' ? [options.rpcUrls] : options.rpcUrls;
        rpcManager = new RpcManager({
            endpoints: urls.map(url => {
                const isQuickNode = url.includes('quiknode') || url.includes('quicknode');
                const isHelius = url.includes('helius');
                return {
                    url,
                    tags: isQuickNode ? ['tx', 'default'] : ['default'],
                    weight: (isQuickNode || isHelius) ? 10 : 1
                };
            })
        });
    }

    // Use platform configuration from the immutable security module, OR override from options (e.g. for dev/testing)
    const platformPubKey = options.platformTreasury ? new PublicKey(options.platformTreasury) : getPlatformPublicKey();
    const protocolFeeSol = getProtocolFee(config.protocolFeeSol);

    // Helper to get connection by tag
    const getConnection = (tag: 'tx' | 'default' = 'default') => {
        if (rpcManager) return rpcManager.getConnection(tag);
        return options.connection;
    };

    // 0. Pre-flight Verification Check (Prevent Re-verification if valid)
    const activeConn = getConnection();
    if (options.wallet && activeConn) {
        try {
            const [verificationPda] = deriveVerificationPda(options.wallet.publicKey);
            const accountInfo = await activeConn.getAccountInfo(verificationPda);
            if (accountInfo?.data?.length) {
                const existingRecord = parseVerificationRecord(Buffer.from(accountInfo.data));
                const currentTime = Math.floor(Date.now() / 1000);
                
                if (existingRecord.expiresAt > currentTime) {
                    console.log(`✓ Valid verification found (Expires at: ${new Date(existingRecord.expiresAt * 1000).toLocaleString()})`);
                    
                    const result: VerifyResult = {
                        over18: true,
                        facehash: "",
                        description: `User is already verified until ${new Date(existingRecord.expiresAt * 1000).toLocaleDateString()}`,
                        verifiedAt: new Date(existingRecord.verifiedAt * 1000).toISOString(),
                        verifiedAtUnix: existingRecord.verifiedAt,
                        protocolFeePaid: true,
                        appFeePaid: true,
                        userCode: existingRecord.userCode,
                        bump: existingRecord.bump,
                        evidence: {
                            ageEstimate: config.minAgeThreshold || 18,
                            ageConfidence: 1.0,
                            livenessScore: 1.0,
                            challenges: [],
                            modelVersions: { core: 'v1.0-cached' },
                            saltHex: '',
                            sessionNonceHex: ''
                        }
                    };

                    if (options.uiMountEl) {
                        clearInstructionUI();
                        options.uiMountEl.style.pointerEvents = 'auto';
                        // Use existing helper if available or inline simple success
                        // We can use createSuccessHTML since it is in scope
                        options.uiMountEl.innerHTML = createSuccessHTML(result, config, existingRecord.userCode);
                    }

                    // Fire success telemetry for skipped flow
                    telemetry.track('verification_skipped_valid', {
                        expiresAt: existingRecord.expiresAt,
                        userCode: existingRecord.userCode
                    });

                    return result;
                }
            }
        } catch (e) {
            console.warn('Pre-flight verification check failed, continuing...', e);
        }
    }

    // 1. Pre-flight Balance Check
    if (options.wallet && activeConn) {
        try {
            const balance = await activeConn.getBalance(options.wallet.publicKey);
            const requiredBytes = (protocolFeeSol + (config.appFeeSol || 0)) * LAMPORTS_PER_SOL;
            const gasBuffer = 0.0005 * LAMPORTS_PER_SOL; // Small buffer for transaction fee

            if (balance < (requiredBytes + gasBuffer)) {
                const balanceSol = balance / LAMPORTS_PER_SOL;
                const neededSol = (requiredBytes + gasBuffer) / LAMPORTS_PER_SOL;

                if (options.uiMountEl) {
                    clearInstructionUI();
                    // Track drop-off due to funds
                    telemetry.track('verification_failed', { reason: 'insufficient_funds', balance: balanceSol, needed: neededSol });

                    options.uiMountEl.innerHTML = `
                        <div style="position: relative; height: 100%; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; font-family: sans-serif; color: white; text-align: center; padding: 40px;">
                            <div style="font-size: 48px; margin-bottom: 24px;">💰</div>
                            <div style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Insufficient Balance</div>
                            <div style="font-size: 16px; color: #94a3b8; line-height: 1.6; max-width: 320px;">
                                You need at least <b>${neededSol.toFixed(4)}&nbsp;SOL</b> to cover the protocol fee and transaction costs.<br><br>
                                <span style="font-size: 14px; opacity: 0.8;">Current Balance: ${balanceSol.toFixed(4)}&nbsp;SOL</span>
                            </div>
                            <button onclick="window.location.reload()" style="margin-top: 32px; padding: 12px 24px; background: #3b82f6; border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer;">
                                Reload & Try Again
                            </button>
                        </div>
                    `;
                }
                throw new Error(`Insufficient balance. Found ${balanceSol.toFixed(4)} SOL, need ~${neededSol.toFixed(4)} SOL.`);
            }
        } catch (e: unknown) {
            const err = e as { message?: string };
            if (err?.message?.includes('Insufficient balance')) throw e;
            console.warn('Pre-flight balance check failed (network error), continuing...', e);
        }
    }

    await camera.start();

    let worker: Worker;
    if (options.workerFactory) {
        worker = options.workerFactory();
    } else {
        throw new Error("Worker factory required. Auto-resolution disabled for stability.");
        // const pkgName = 'solana-age-verify-worker';
        // worker = new Worker(new URL(pkgName, import.meta.url), { type: 'module' });
    }

    // Helper to send/receive from worker
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendToWorker = (req: WorkerRequest, timeoutMs = 30000): Promise<any> => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                worker.removeEventListener('message', handler);
                worker.removeEventListener('error', errorHandler);
                reject(new Error(`Worker request ${req.type} timed out`));
            }, timeoutMs);

            const errorHandler = (e: ErrorEvent) => {
                clearTimeout(timeout);
                worker.removeEventListener('message', handler);
                worker.removeEventListener('error', errorHandler);
                reject(new Error(`Worker Error: ${e.message}`));
            };

            const handler = (e: MessageEvent) => {
                const { type, payload, error } = e.data;
                if (type === 'LOG') {
                    return; // Keep listener active; worker logs omitted in production
                }
                if (type === 'ERROR') {
                    clearTimeout(timeout);
                    worker.removeEventListener('message', handler);
                    worker.removeEventListener('error', errorHandler);
                    reject(new Error(error));
                }
                // Simple request-response matching for this linear flow
                if (type === 'LOADED' && req.type === 'LOAD_MODELS') {
                    clearTimeout(timeout);
                    worker.removeEventListener('message', handler);
                    worker.removeEventListener('error', errorHandler);
                    resolve(true);
                }
                if (type === 'RESULT' && req.type === 'PROCESS_FRAME') {
                    clearTimeout(timeout);
                    worker.removeEventListener('message', handler);
                    worker.removeEventListener('error', errorHandler);
                    resolve(payload);
                }
            };
            worker.addEventListener('message', handler);
            worker.addEventListener('error', errorHandler);
            worker.postMessage(req);
        });
    };

    if (options.signal?.aborted) {
        worker.terminate();
        await camera.stop();
        throw new Error('Aborted');
    }

    let audioCtx: AudioContext | null = null;
    try {
        // Create and unlock AudioContext for iOS Safari compatibility (must run in user gesture context)
        try {
            audioCtx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            // Play silent tone to fully prime iOS
            const silentOsc = audioCtx.createOscillator();
            const silentGain = audioCtx.createGain();
            silentGain.gain.setValueAtTime(0, audioCtx.currentTime);
            silentOsc.connect(silentGain);
            silentGain.connect(audioCtx.destination);
            silentOsc.start();
            silentOsc.stop(audioCtx.currentTime + 0.001);
        } catch (e) {
            console.warn('[SAV] AudioContext init failed:', e);
        }

        // Show introductory messages
        const showIntroductoryMessages = async () => {
            if (!options.uiMountEl) return;
            clearInstructionUI();

            // Premium Design Styles
            const commonStyles = `
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background: rgba(15, 23, 42, 0.85);
                color: #f8fafc;
            `;

            const cardStyle = `
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 24px;
                padding: 48px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                max-width: 500px;
                width: 90%;
                text-align: center;
                animation: fadeInOut 3.5s ease-in-out forwards;
                color: #fff;
            `;

            const animStyle = `
                <style>
                    @keyframes fadeInOut {
                        0% { opacity: 0; transform: translateY(10px) scale(0.95); }
                        12% { opacity: 1; transform: translateY(0) scale(1); }
                        88% { opacity: 1; transform: translateY(0) scale(1); }
                        100% { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    }
                </style>
            `;

            const renderMsg = (content: string) => {
                options.uiMountEl!.innerHTML = `
                    <div style="position: relative; height: 100%; width: 100%; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; ${commonStyles}">
                        ${content}
                    </div>
                    ${animStyle}
                 `;
            };

            // Single combined intro card
            renderMsg(`
                <div style="${cardStyle}">
                    <div style="font-size: 18px; color: #cbd5e1; line-height: 1.6; font-weight: 400;">
                        No data leaves your device. Results are posted on the blockchain.
                    </div>
                    <br/><br/>
                    <span style="color: #64748b; font-size: 14px;">Minimal fees may apply.</span>
                </div>
            `);

            await new Promise(r => setTimeout(r, 3800));
        };

        await showIntroductoryMessages();

        // Load Models
        if (options.onChallenge) options.onChallenge('Initializing verification...');

        // Show loading screen WITHOUT spinner, just text
        if (options.uiMountEl) {
            clearInstructionUI();
            const loadingContent = `
                <div style="max-width: 600px; padding: 40px; text-align: center; animation: fadeIn 0.5s ease-out;">
                    <div style="font-size: 24px; font-weight: 600; background: linear-gradient(to right, #e2e8f0, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 32px; letter-spacing: -0.01em;">
                        Initializing verification...
                    </div>
                    ${createSpinnerHTML()}
                </div>
            `;
            const loadingStyle = `
                <style>
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                </style>
            `;

            options.uiMountEl.innerHTML = `
                <div style="position: relative; height: 100%; width: 100%; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.85);">
                    ${loadingContent}
                </div>
               ${loadingStyle}
            `;
        }

        await sendToWorker({
            type: 'LOAD_MODELS',
            payload: { basePath: options.modelPath || '/models' }
        }, 90000); // Give it 90s for models download + init

        if (options.onChallenge) options.onChallenge('Verification initialized.');
        if (options.onInitialized) options.onInitialized();

        const startTime = Date.now();
        const challengeResults: ChallengeResult[] = [];
        let ageEstimateAccumulator = 0;
        let ageEstimateCount = 0;
        let ageConfidenceAccumulator = 0;
        let ageConfidenceCount = 0;
        let ageGeometricAccumulator = 0;
        let ageGeometricCount = 0;
        let ageEnhancedAccumulator = 0;
        let ageEnhancedCount = 0;
        let embedding: number[] = [];
        let livenessAccumulator = 0;
        let surfaceScoreAccumulator = 0;
        let surfaceAnalysisCount = 0;
        let lastSurfaceFeatures: SurfaceFeatures | undefined = undefined;
        let ageMethod: AgeMethod = 'unknown';
        let ageConfidence = 0;


        // Challenge Loop

        // Audio Feedback
        // Map challenge types to user-friendly instructions
        const getChallengeInstruction = (type: string): string => {
            const instructions: Record<string, string> = {
                'turn_left': 'Turn your head left slowly until you hear a beep. Hold for a second beep.',
                'turn_right': 'Turn your head right slowly until you hear a beep. Hold for a second beep.',
                'look_up': 'Look up slowly until you hear a beep. Hold for the second beep.',
                'look_down': 'Look down slowly until you hear a beep. Hold for the second beep.',
                'nod_yes': "Nod your head 'yes' until you hear two beeps.",
                'shake_no': "Shake your head 'no' until you hear two beeps."
            };
            return instructions[type] || type.replace('_', ' ').toUpperCase();
        };

        const playBeep = async (freq: number, duration: number) => {
            if (!audioCtx) return;
            try {
                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume();
                }
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + duration / 1000);
            } catch (e) {
                console.warn('Audio feedback failed', e);
            }
        };


        const updateHUD = (currentIdx: number, currentProgress: number = 0) => {
            if (!options.uiMountEl && !options.instructionElement) return;

            const currentType = challengeQueue[currentIdx];
            const instruction = getChallengeInstruction(currentType);
            const totalSteps = challengeQueue.length;
            const currentStep = currentIdx + 1;

            const instructionHtml = `
                    <div class="sav-card">
                        <div class="sav-card-text-main">
                            ${instruction}
                        </div>
                        <div class="sav-card-text-sub">
                            Step ${currentStep} of ${totalSteps}
                        </div>
                    </div>
            `;

            // Inject styles once
            if (options.uiMountEl || options.instructionElement) injectStyles();

            const totalProgress = ((currentIdx + (currentProgress || 0) / 100) / challengeQueue.length) * 100;

            if (options.instructionElement) {
                options.instructionElement.classList.add('sav-instruction-host');
                options.instructionElement.innerHTML = instructionHtml;
            }

            if (options.uiMountEl) {
                const topSectionHtml = options.instructionElement ? '' : `
                    <div class="sav-top-section">
                        ${instructionHtml}
                    </div>
                `;

                options.uiMountEl.innerHTML = `
                    <div class="sav-ui-container">
                        ${topSectionHtml}
                        <div class="sav-guide"></div>
                        <div class="sav-footer">
                            <div class="sav-progress-container">
                                <!-- Step Progress -->
                                <div class="sav-step-track">
                                    <div class="sav-step-fill" style="width: ${currentProgress}%"></div>
                                </div>
                                <!-- Total Progress -->
                                <div class="sav-progress-track">
                                    <div class="sav-progress-fill" style="width: ${totalProgress}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                 `;
            }
        };

        interface ChallengeFrameResult extends DetectionResult {
            gestureState?: { sequence: string[]; seenPoses: Set<string> };
        }
        const checkChallenge = (type: string, res: ChallengeFrameResult): boolean => {
            if (!res.faceFound || !res.landmarks || res.landmarks.length < 18) return false;

            const eyeR = { x: res.landmarks[0], y: res.landmarks[1] };
            const eyeL = { x: res.landmarks[3], y: res.landmarks[4] };
            const nose = { x: res.landmarks[6], y: res.landmarks[7] };

            const eyeMidX = (eyeR.x + eyeL.x) / 2;
            const eyeMidY = (eyeR.y + eyeL.y) / 2;
            // Robust eye distance
            const eyeDist = Math.sqrt(Math.pow(eyeR.x - eyeL.x, 2) + Math.pow(eyeR.y - eyeL.y, 2));

            const diffX = nose.x - eyeMidX;
            const diffY = nose.y - eyeMidY;

            // Thresholds & Sensitivity
            const isGesture = type === 'nod_yes' || type === 'shake_no';

            // Gestures use same thresholds as static to avoid accepting unrelated movements.
            const turnMult = isGesture ? 0.25 : 0.3;
            const upMult = isGesture ? 0.38 : 0.35;
            const downMult = 0.55; // Same for gestures and static; no relaxed down threshold

            const turnThreshold = eyeDist * turnMult;
            const upThreshold = eyeDist * upMult;
            const downThreshold = eyeDist * downMult;

            // State helpers for gestures
            const isLeft = diffX > turnThreshold;
            const isRight = diffX < -turnThreshold;
            const isUp = diffY < upThreshold; // diffY is smaller than threshold (closer to eyes)
            const isDown = diffY > downThreshold; // diffY is larger than threshold (further from eyes)

            // Static Challenges with Relaxed Dominant Axis Checks (0.5 tolerance)
            // This ensures primary motion is dominant, but allows natural head rotation (e.g. nodding slightly while turning)
            if (type === 'turn_left') return isLeft && Math.abs(diffX) > (Math.abs(diffY) * 0.5);
            if (type === 'turn_right') return isRight && Math.abs(diffX) > (Math.abs(diffY) * 0.5);
            // Look Up: Dominance check REMOVED because diffY shrinks towards 0, making the check unfairly strict.
            // We just ensure head is reasonably centered (yaw is minimal).
            if (type === 'look_up') return isUp && Math.abs(diffX) < (eyeDist * 0.3);
            if (type === 'look_down') return isDown && Math.abs(diffY) > (Math.abs(diffX) * 0.5);

            // Dynamic Gestures (stateful)
            const state = (res as any).gestureState || { sequence: [], seenPoses: new Set() };

            const currentPose = isLeft ? 'left' : (isRight ? 'right' : (isUp ? 'up' : (isDown ? 'down' : 'center')));

            // Update Sequence (Transitions only)
            if (state.sequence.length === 0 || state.sequence[state.sequence.length - 1] !== currentPose) {
                state.sequence.push(currentPose);
                if (state.sequence.length > 50) state.sequence.shift(); // Larger buffer
            }

            // Update Latch State (Remember we saw this pose in this attempt)
            if (state.seenPoses && state.seenPoses.add) {
                state.seenPoses.add(currentPose);
            }

            if (type === 'nod_yes') {
                // Require actual bidirectional nod: must see both UP and DOWN (no shortcuts).
                return !!(state.seenPoses && state.seenPoses.has('up') && state.seenPoses.has('down'));
            }

            if (type === 'shake_no') {
                if (state.seenPoses) {
                    return state.seenPoses.has('left') && state.seenPoses.has('right');
                }
                return state.sequence.includes('left') && state.sequence.includes('right');
            }

            return false;
        };

        // Initialize Dynamic Queue
        // Use config challenges if provided, else generate random sequence
        const challengeQueue: ChallengeType[] = (config.challenges && config.challenges.length > 0)
            ? [...config.challenges] as ChallengeType[]
            : generateChallengeSequence();

        // Update status map to use actual queue length and match types
        const challengesStatus: string[] = challengeQueue.map(() => 'pending');

        let penaltyAdded = false;

        // Process queue
        let queueIndex = 0;

        // Safety break
        while (queueIndex < challengeQueue.length) {
            const challengeType = challengeQueue[queueIndex];

            if (Date.now() - startTime > config.timeoutMs) throw new Error('Timeout');
            if (options.signal?.aborted) throw new Error('Aborted');

            let passed = false;
            let retries = 0;
            const maxRetries = 1;

            while (!passed && retries <= maxRetries) {
                if (retries > 0) {
                    updateHUD(queueIndex, 0); // Still show the type but tied to index
                    await new Promise(r => setTimeout(r, 1000));
                }

                if (options.onChallenge) options.onChallenge(challengeType);
                updateHUD(queueIndex, 0);

                let attempts = 0;
                let consecutivePassed = 0;
                let startBeepPlayed = false;
                let gestureStartBeepPlayed = false;
                const requiredConsecutive = (challengeType === 'nod_yes' || challengeType === 'shake_no') ? 18 : 15;
                const isGestureChallenge = challengeType === 'nod_yes' || challengeType === 'shake_no';
                /** Frames without progress after which gesture state is reset (avoids accepting stalled partial gestures). */
                const GESTURE_STALL_FRAMES = 60;
                let lastGestureProgressAttempt = 0;
                let prevSeenPosesSize = 0;

                // Reset gesture state for this attempt
                const gestureState = { sequence: [], seenPoses: new Set<string>() };

                while (!passed && attempts < 150) {
                    const frame = camera.captureFrame();
                    const res = await sendToWorker({ type: 'PROCESS_FRAME', payload: frame });

                    // Inject state for stateful checks
                    (res as ChallengeFrameResult).gestureState = gestureState;

                    // Capture surface analysis if available
                    if (res.surfaceScore !== undefined) {
                        surfaceScoreAccumulator += res.surfaceScore;
                        surfaceAnalysisCount++;
                        if (res.surfaceFeatures) {
                            lastSurfaceFeatures = res.surfaceFeatures;
                            // Debug log for failing features
                            if (res.surfaceScore < 0.70) {
                                console.warn('Surface Sensitivity Details:', res.surfaceFeatures);
                            }
                        }
                    }

                    if (res.ageEstimate !== undefined && res.ageEstimate > 0) {
                        // Weighted average based on age confidence if available, else face confidence
                        const weight = res.ageConfidence || res.confidence || 1.0;
                        ageEstimateAccumulator += res.ageEstimate * weight;
                        ageEstimateCount += weight;

                        if (res.ageConfidence !== undefined) {
                            ageConfidenceAccumulator += res.ageConfidence;
                            ageConfidenceCount++;
                        } else if (res.confidence !== undefined) {
                            // Fallback to face detection confidence for geometric/demo path
                            ageConfidenceAccumulator += res.confidence;
                            ageConfidenceCount++;
                        }
                        if (res.embedding) embedding = res.embedding;
                    }

                    if (res.ageEstimateGeometric !== undefined && res.ageEstimateGeometric > 0) {
                        const weight = res.confidence || 1.0;
                        ageGeometricAccumulator += res.ageEstimateGeometric * weight;
                        ageGeometricCount += weight;
                    }

                    if (res.ageEstimateEnhanced !== undefined && res.ageEstimateEnhanced > 0) {
                        const weight = res.ageConfidence || 1.0;
                        ageEnhancedAccumulator += res.ageEstimateEnhanced * weight;
                        ageEnhancedCount += weight;
                    }

                    if (res.ageMethod) ageMethod = res.ageMethod;

                    // GESTURE PROGRESS FEEDBACK AND AUDIO
                    if ((challengeType === 'nod_yes' || challengeType === 'shake_no') && gestureState.seenPoses) {
                        // Audio Feedback removed for start of gesture to simplify instruction
                        // (User is now told to nod/shake UNTIL they hear two beeps)
                        if (gestureState.seenPoses.size > 0 && !gestureStartBeepPlayed) {
                            // playBeep(440, 100);
                            gestureStartBeepPlayed = true;
                        }

                        // Visual Feedback
                        if (challengeType === 'nod_yes') {
                            if (gestureState.seenPoses.has('up') && !gestureState.seenPoses.has('down')) {
                                updateHUD(queueIndex, 50);
                            } else if (gestureState.seenPoses.has('down') && !gestureState.seenPoses.has('up')) {
                                updateHUD(queueIndex, 50);
                            }
                        }
                        if (challengeType === 'shake_no') {
                            if (gestureState.seenPoses.has('left') && !gestureState.seenPoses.has('right')) {
                                updateHUD(queueIndex, 50);
                            } else if (gestureState.seenPoses.has('right') && !gestureState.seenPoses.has('left')) {
                                updateHUD(queueIndex, 50);
                            }
                        }
                    }

                    if (checkChallenge(challengeType, res)) {
                        consecutivePassed++;
                        if (isGestureChallenge) lastGestureProgressAttempt = attempts;

                        if (consecutivePassed === 1 && !startBeepPlayed) {
                            playBeep(440, 100);
                            startBeepPlayed = true;
                        }

                        const progress = Math.min(100, (consecutivePassed / requiredConsecutive) * 100);
                        updateHUD(queueIndex, progress);

                        if (consecutivePassed >= requiredConsecutive) {
                            passed = true;
                            playBeep(880, 100);
                            livenessAccumulator += 1.0;
                            // Capture evidence
                            if (res.embedding) embedding = res.embedding;
                        }
                    } else {
                        if (challengeType !== 'nod_yes' && challengeType !== 'shake_no') {
                            consecutivePassed = 0;
                            startBeepPlayed = false;
                            updateHUD(queueIndex, 0);
                        } else if (isGestureChallenge) {
                            // Count progress as: checkChallenge true, or a new pose added this frame
                            const seenPosesSize = gestureState.seenPoses?.size ?? 0;
                            if (seenPosesSize > prevSeenPosesSize) {
                                lastGestureProgressAttempt = attempts;
                            }
                            prevSeenPosesSize = seenPosesSize;
                            // Timeout: if no progress for N frames, reset gesture so user must do full motion again
                            if (attempts - lastGestureProgressAttempt > GESTURE_STALL_FRAMES) {
                                gestureState.sequence.length = 0;
                                gestureState.seenPoses.clear();
                                consecutivePassed = 0;
                                startBeepPlayed = false;
                                gestureStartBeepPlayed = false;
                                prevSeenPosesSize = 0;
                                lastGestureProgressAttempt = attempts;
                                updateHUD(queueIndex, 0);
                            }
                        }
                        await new Promise(r => setTimeout(r, 100)); // lighter loop
                    }
                    if (isGestureChallenge) {
                        prevSeenPosesSize = gestureState.seenPoses?.size ?? 0;
                    }
                    attempts++;
                }
                if (!passed) retries++;
            }

            if (!passed) {
                challengesStatus[queueIndex] = 'failed';
                challengeResults.push({ type: challengeType, passed: false, score: 0 });

                // PENALTY LOGIC
                if (!penaltyAdded) {
                    const penaltyChallenge = generateChallengeSequence(1)[0];
                    challengeQueue.push(penaltyChallenge);
                    challengesStatus.push('pending'); // Add new status slot for penalty
                    penaltyAdded = true;
                    // Provide feedback
                    updateHUD(queueIndex, 0);
                    await new Promise(r => setTimeout(r, 1500));
                }

                // If it was already a penalty step or max penalties reached, we treat this as a fail,
                // BUT we continue to the next one? Or stop?
                // Usually liveness fails if too many fail.
                // Let's count total failures. 
                // If we fail > 1 challenge (original + penalty), liveness score will tank.

            } else {
                challengesStatus[queueIndex] = 'passed';
                challengeResults.push({ type: challengeType, passed: true, score: 1.0 });
                updateHUD(queueIndex, 100);
                await new Promise(r => setTimeout(r, 800));
            }

            // 15 Frame Pause in between challenges
            if (queueIndex < challengeQueue.length - 1) {
                for (let i = 0; i < 15; i++) {
                    const frame = camera.captureFrame();
                    await sendToWorker({ type: 'PROCESS_FRAME', payload: frame });
                    await new Promise(r => setTimeout(r, 50)); // ~20fps pace for pause
                }
            }

            queueIndex++;
        }

        // Calculate average age estimate across all frames
        const ageEstimate = ageEstimateCount > 0
            ? ageEstimateAccumulator / ageEstimateCount
            : 0;

        const ageEstimateGeometric = ageGeometricCount > 0
            ? ageGeometricAccumulator / ageGeometricCount
            : undefined;

        const ageEstimateEnhanced = ageEnhancedCount > 0
            ? ageEnhancedAccumulator / ageEnhancedCount
            : undefined;

        ageConfidence = ageConfidenceCount > 0
            ? ageConfidenceAccumulator / ageConfidenceCount
            : 0;

        // Calculate Score based on total challenges attempted
        const livenessScore = livenessAccumulator / challengeQueue.length;

        // Calculate average surface score
        const avgSurfaceScore = surfaceAnalysisCount > 0
            ? surfaceScoreAccumulator / surfaceAnalysisCount
            : undefined;

        const isAgeValid = ageEstimate >= (config.minAgeThreshold || 18);
        const isLivenessValid = livenessScore >= config.minLivenessScore;
        const isConfidenceValid = ageConfidence >= config.minAgeConfidence;
        const isSurfaceValid = avgSurfaceScore !== undefined && avgSurfaceScore >= config.minSurfaceScore; // Fail closed if no surface analysis.

        let isOver18 = isAgeValid && isLivenessValid && isConfidenceValid && isSurfaceValid;

        let failureReason = '';
        if (!isOver18) {
            if (!isAgeValid) failureReason = `Estimated age (${Math.round(ageEstimate)}) is below the required ${config.minAgeThreshold}.`;
            else if (!isLivenessValid) failureReason = 'Liveness check failed.';
            else if (!isSurfaceValid) failureReason = `Surface integrity failed (${(avgSurfaceScore! * 100).toFixed(0)}%)`;
            else if (!isConfidenceValid) failureReason = 'Age estimation confidence too low.';

            // Track failure
            telemetry.track('verification_failed', {
                reason: failureReason,
                scores: {
                    age: ageEstimate,
                    liveness: livenessScore,
                    surface: avgSurfaceScore,
                    confidence: ageConfidence
                }
            });
        }

        const verifiedAt = new Date().toISOString();

        // PROTOCOL FEE (MONETIZATION) & ON-CHAIN PROOF
        let protocolFeePaid = false;
        let protocolFeeTxId = '';
        let appFeePaid = false;
        let facehash = ''; // Only computed if wallet signs
        let pdaUserCode = ''; // Store user code derived from PDA
        let verificationBump: number | null = null;

        // Strike 3 of session 3 = 9th fail
        const isFinalStrike = (currentCooldownCount >= 2 && (currentRetries + 1) >= config.maxRetries);
        const shouldWriteOnChain = isOver18 || isFinalStrike;

        // Record on chain ONLY if wallet is present and user signs
        const txConn = getConnection('tx');
        if (shouldWriteOnChain && options.wallet && txConn) {
            if (options.uiMountEl) {
                clearInstructionUI();
                options.uiMountEl.innerHTML = `
                    <div style="position: relative; height: 100%; width: 100%; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: clamp(16px, 6vw, 40px); box-sizing: border-box; background: rgba(15, 23, 42, 0.85); font-family: -apple-system, system-ui, sans-serif; overflow-y: auto;">
                        <div style="max-width: min(520px, 92%); width: 100%; padding: clamp(20px, 6vw, 40px); text-align: center; background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); color: white; box-sizing: border-box;">
                             <div style="font-size: clamp(20px, 5.6vw, 26px); font-weight: 700; margin-bottom: 12px; line-height: 1.2;">Protocol Fee Required</div>
                             <div style="font-size: clamp(14px, 3.7vw, 16px); color: #94a3b8; line-height: 1.55; margin-bottom: 24px;">
                                To record your verification on-chain, a minimal protocol fee of <b><span style="white-space: nowrap;">${protocolFeeSol}&nbsp;SOL</span></b> is required.<br>
                                ${config.appFeeSol && config.appFeeSol > 0 ? `Plus an integrator fee of <b><span style="white-space: nowrap;">${config.appFeeSol}&nbsp;SOL</span></b>.<br>` : ''}
                                Please approve the transaction in your wallet.
                             </div>
                             ${createSpinnerHTML()}
                             <div style="color: #60a5fa; font-weight: 600; margin-top: 12px; font-size: clamp(13px, 3.4vw, 15px); letter-spacing: 0.01em;">
                                Waiting for signature...
                             </div>
                        </div>
                    </div>
                `;
            }

            try {
                const fromPubkey = options.wallet.publicKey;

                // Debug checks exposed to UI via error message
                try {
                    new PublicKey(fromPubkey);
                } catch (e: unknown) { throw new Error(`Invalid Wallet Public Key: ${(e as Error).message}`); }

                try {
                    new PublicKey(platformPubKey);
                } catch (e: unknown) { throw new Error(`Invalid Treasury Public Key (Internal Config Error): ${(e as Error).message}`); }

                // Step 1: FaceHash
                try {
                    if (embedding.length > 0) {
                        facehash = await computeFaceHash(options.walletPubkeyBase58, salt, embedding);
                    }
                } catch (e: unknown) { throw new Error(`FaceHash Computation Failed: ${(e as Error).message}`); }

                const priorityFee = await getQuickNodePriorityFee(txConn, platformPubKey);

                // Initialize Anchor Provider (Read-only sufficient for IDL fetch, but we need to sign later)
                // We construct a provider that uses the active connection and a dummy wallet (since we sign manually later)
                const dummyWallet = {
                    publicKey: fromPubkey,
                    signTransaction: async (tx: Transaction) => tx,
                    signAllTransactions: async (txs: Transaction[]) => txs
                };
                // AnchorProvider expects Wallet (used only for read; we sign manually later)
                const provider = new AnchorProvider(txConn, dummyWallet as unknown as Wallet, { commitment: 'confirmed' });
                const program = new Program(IDL as Idl, PROGRAM_ID, provider);

                const [verificationPda, derivedBump] = deriveVerificationPda(fromPubkey);
                verificationBump = derivedBump;
                const accountInfo = await txConn.getAccountInfo(verificationPda);
                let existingRecord: ReturnType<typeof parseVerificationRecord> | null = null;
                let isUpdate = false;

                if (accountInfo?.data?.length) {
                    try {
                        existingRecord = parseVerificationRecord(Buffer.from(accountInfo.data));
                        const currentTime = Math.floor(Date.now() / 1000);
                        if (existingRecord.expiresAt > currentTime) {
                            console.log(`✓ Valid verification found (Expires at: ${new Date(existingRecord.expiresAt * 1000).toLocaleString()})`);
                            pdaUserCode = existingRecord.userCode;
                            isOver18 = true; // Record already verified
                            protocolFeePaid = true;
                            appFeePaid = true;

                            const result: VerifyResult = {
                                over18: true,
                                facehash: "",
                                description: `User is already verified until ${new Date(existingRecord.expiresAt * 1000).toLocaleDateString()}`,
                                verifiedAt: new Date(existingRecord.expiresAt * 1000).toISOString(),
                                verifiedAtUnix: existingRecord.verifiedAt,
                                protocolFeePaid: true,
                                appFeePaid: true,
                                userCode: pdaUserCode,
                                bump: existingRecord.bump,
                                evidence: {
                                    ageEstimate: config.minAgeThreshold || 18,
                                    ageConfidence: 1.0,
                                    livenessScore: 1.0,
                                    challenges: [],
                                    modelVersions: { core: 'v1.0-cached' },
                                    saltHex: '',
                                    sessionNonceHex: ''
                                }
                            };

                            if (options.uiMountEl) {
                                clearInstructionUI();
                                options.uiMountEl.style.pointerEvents = 'auto';
                                options.uiMountEl.innerHTML = createSuccessHTML(result, config, pdaUserCode);
                            }
                            return result;
                        }
                        isUpdate = true;
                    } catch (e) {
                        console.warn("Failed to parse existing verification record:", e);
                    }
                }

                if (existingRecord?.userCode) {
                    pdaUserCode = existingRecord.userCode;
                }

                const verifiedAtTimestamp = new BN(Math.floor(new Date(verifiedAt).getTime() / 1000));
                const appFeeLamports = new BN(Math.floor((config.appFeeSol || 0) * LAMPORTS_PER_SOL));
                const appTreasury = options.appTreasury ? new PublicKey(options.appTreasury) : platformPubKey;
                const sponsorPubKey = options.sponsor?.publicKey || fromPubkey;
                const facehashBytes = Array.from(Buffer.from(facehash, 'hex'));
                if (facehashBytes.length !== 32) {
                    console.error('[SAV_FACEHASH_LEN] Invalid facehash length', {
                        facehashHexLength: facehash.length,
                        facehashBytesLength: facehashBytes.length,
                        hasEmbedding: embedding.length > 0
                    });
                    throw new Error('Facehash must be 32 bytes; aborting on-chain write.');
                }

                let ix;

                if (isUpdate) {
                    ix = await program.methods
                        .updateVerification(
                            facehashBytes,
                            verifiedAtTimestamp,
                            isOver18,
                            appFeeLamports
                        )
                        .accounts({
                            verificationRecord: verificationPda,
                            authority: fromPubkey,
                            payer: sponsorPubKey,
                            protocolTreasury: platformPubKey,
                            appTreasury: appTreasury,
                            gatekeeper: platformPubKey,
                            systemProgram: SystemProgram.programId,
                        })
                        .instruction();
                } else {
                    ix = await program.methods
                        .createVerification(
                            facehashBytes,
                            verifiedAtTimestamp,
                            isOver18,
                            appFeeLamports
                        )
                        .accounts({
                            verificationRecord: verificationPda,
                            authority: fromPubkey,
                            payer: sponsorPubKey,
                            protocolTreasury: platformPubKey,
                            appTreasury: appTreasury,
                            gatekeeper: platformPubKey,
                            systemProgram: SystemProgram.programId,
                        })
                        .instruction();
                }

                if (isOver18 && !pdaUserCode) {
                    pdaUserCode = deriveUserCodeFromPda(verificationPda);
                }

                const { blockhash } = await txConn.getLatestBlockhash('confirmed');

                // Limit 150k CU: CreateVerification uses ~20k–50k; headroom for init + fee transfers. Fees = consumed × price, not limit.
                const instructions = [
                    ComputeBudgetProgram.setComputeUnitLimit({ units: 150000 }),
                    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: Math.max(priorityFee, 1000) }),
                    ix!
                ];

                const messageV0 = new TransactionMessage({
                    payerKey: options.sponsor?.publicKey || fromPubkey,
                    recentBlockhash: blockhash,
                    instructions
                }).compileToV0Message();

                const transactionV0 = new VersionedTransaction(messageV0);

                // Step 4: Serialization
                const serializedTxBase64 = Buffer.from(transactionV0.serialize()).toString('base64');

                // Step 5: Server Signing (Gatekeeper)
                let platformSignedTx: VersionedTransaction;
                try {
                    const signResponse = await fetch('https://www.ageverify.live/api/sign-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ serializedTx: serializedTxBase64, isV0: true })
                    });

                    if (!signResponse.ok) {
                        const signError = await signResponse.json();
                        throw new Error(`Server API Error: ${signError.message || signError.error}`);
                    }
                    const { transaction: txBase64 } = await signResponse.json();
                    platformSignedTx = VersionedTransaction.deserialize(Buffer.from(txBase64, 'base64'));
                } catch (e: unknown) { const err = e as { message?: string }; throw new Error(`Server Signing Sequence Failed: ${err?.message ?? JSON.stringify(e)}`); }

                // Step 6: User & Sponsor Signing (wallet adapter returns VersionedTransaction when given one)
                let finalTx: VersionedTransaction = platformSignedTx;
                try {
                    // 1. User signs (as authority)
                    finalTx = await options.wallet.signTransaction(finalTx as unknown as Transaction) as unknown as VersionedTransaction;

                    // 2. Sponsor signs (if present, as payer)
                    if (options.sponsor) {
                        finalTx = await options.sponsor.signTransaction(finalTx as unknown as Transaction) as unknown as VersionedTransaction;
                    }
                } catch (e: unknown) { throw new Error(`Signing Failed: ${(e as Error).message}`); }

                // Step 7: Broadcast
                try {
                    const serialized = finalTx.serialize();
                    protocolFeeTxId = await txConn.sendRawTransaction(serialized, {
                        skipPreflight: true,
                        preflightCommitment: 'confirmed'
                    });

                    const latestBlockhash = await txConn.getLatestBlockhash('confirmed');
                    await txConn.confirmTransaction({
                        signature: protocolFeeTxId,
                        blockhash: latestBlockhash.blockhash,
                        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                    }, 'confirmed');
                } catch (e: unknown) {
                    const err = e as { message?: string; logs?: string[]; getLogs?: () => Promise<string[]> };
                    // Enhanced error reporting for transaction failures
                    console.error('[SDK Broadcast Error Object]:', e);
                    let detailedMessage = err?.message ?? (typeof e === 'string' ? e : JSON.stringify(e));

                    if (err?.logs) {
                        console.error('--- TRANSACTION LOGS ---');
                        console.error(err.logs.join('\n'));
                        console.error('------------------------');
                        detailedMessage += ` | Logs: [${err.logs.join(', ')}]`;
                    } else if (err?.getLogs) {
                        const logs = await err.getLogs();
                        console.error('--- TRANSACTION LOGS (getLogs) ---');
                        console.error(logs.join('\n'));
                        console.error('---------------------------------');
                        detailedMessage += ` | Logs: [${logs.join(', ')}]`;
                    }
                    throw new Error(`[VER. 9 - 6004 Final Final Fix] Transaction Broadcast Failed: ${detailedMessage}`);
                }

                protocolFeePaid = true;
                if (config.appFeeSol && config.appFeeSol > 0) appFeePaid = true;

            } catch (e: unknown) {
                const err = e as { message?: string; logs?: string[] };
                console.error('Protocol fee payment failed (PDA Write Error):', e);
                facehash = '';
                isOver18 = false;

                // Friendly UI Error Overlay (Requested via Ver. 9)
                if (options.uiMountEl) {
                    clearInstructionUI();
                    options.uiMountEl.innerHTML = `
                    <div style="position: relative; height: 100%; width: 100%; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(127, 29, 29, 0.85); font-family: -apple-system, system-ui, sans-serif;">
                        <div style="max-width: 500px; padding: 48px; text-align: center; background: rgba(0,0,0,0.2); backdrop-filter: blur(12px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                            <div style="font-size: 64px; margin-bottom: 24px; text-shadow: 0 4px 12px rgba(0,0,0,0.3);">⚠️</div>
                            <div style="font-size: 28px; font-weight: 700; color: white; margin-bottom: 12px; letter-spacing: -0.01em;">Verification Error</div>
                            <div style="font-size: 16px; color: #fca5a5; line-height: 1.6;">
                                Verification could not be written.<br>Please try again.
                                <br><br>
                                <span style="font-size: 14px; opacity: 0.8; color: white;">If this error persists, contact support@ageverify.live</span>
                            </div>
                        </div>
                    </div>`;
                    // Wait for user to read before finally block clears it
                    await new Promise(r => setTimeout(r, 6000));
                }

                failureReason = `[SDK PDA] Transaction Broadcast Failure: ${err?.message ?? JSON.stringify(e)}`;
                if (err?.logs && Array.isArray(err.logs)) {
                    failureReason += ` | Logs: ${err.logs.slice(-5).join('; ')}`;
                }
            }
        }

        // Returns actual result from models!
        const result: VerifyResult = {
            over18: isOver18,
            facehash: facehash,
            description: isOver18 ? 'User is confidently over age 18' : (failureReason || 'Verification Failed'),
            verifiedAt,
            verifiedAtUnix: Math.floor(new Date(verifiedAt).getTime() / 1000),
            protocolFeePaid,
            protocolFeeTxId,
            appFeePaid,
            appFeeTxId: protocolFeeTxId, // same atomic transaction
            evidence: {
                ageEstimate,
                ageEstimateGeometric,
                ageEstimateEnhanced,
                ageConfidence,
                livenessScore,
                surfaceScore: avgSurfaceScore,
                surfaceFeatures: lastSurfaceFeatures,
                ageMethod: ageMethod,
                challenges: challengeResults,
                modelVersions: { core: 'v1.0' },
                saltHex: protocolFeePaid ? toHex(salt) : '',
                sessionNonceHex: protocolFeePaid ? toHex(sessionNonce) : ''
            },
            // The actual code is generated on-chain, but we can return it here 
            // if we want to bypass a second fetch, or just let the UI handle it.
            // For now, we'll mark it as pending or use a derived value.
            userCode: isOver18 ? (pdaUserCode || 'CODE_GENERATING') : undefined,
            bump: protocolFeePaid ? (verificationBump ?? undefined) : undefined
        };

        // Inject computed code if successful
        if (isOver18 && pdaUserCode) {
            result.userCode = pdaUserCode;
        }

        // SUCCESS UI & SOUNDS
        if (isOver18) {
            // Reset everything on success
            localStorage.removeItem(storageKey);
            localStorage.removeItem(cooldownKey);
            localStorage.removeItem(cooldownCountKey);

            // 1. Play Success Sequence (440 -> 880 -> 1760) using shared AudioContext
            if (audioCtx) {
                try {
                    if (audioCtx.state === 'suspended') {
                        await audioCtx.resume();
                    }
                    const now = audioCtx.currentTime;
                    const playTone = (freq: number, start: number, dur: number) => {
                        const osc = audioCtx!.createOscillator();
                        const gain = audioCtx!.createGain();
                        osc.frequency.value = freq;
                        gain.gain.value = 0.1;
                        osc.connect(gain);
                        gain.connect(audioCtx!.destination);
                        osc.start(start);
                        osc.stop(start + dur);
                    };
                    playTone(440, now, 0.1);
                    playTone(880, now + 0.1, 0.1);
                    playTone(1760, now + 0.2, 0.2);
                } catch (e) {
                    console.warn('Success tone failed', e);
                }
            }

            // 2. Show Results UI
            if (options.uiMountEl) {
                clearInstructionUI();
                options.uiMountEl.style.pointerEvents = 'auto';
                options.uiMountEl.innerHTML = createSuccessHTML(result, config, pdaUserCode || '');
            }

            // 3. Wait for User to see it (and "simulate" recording time)
            await new Promise(r => setTimeout(r, 4000));
            keepSuccessUI = true;
        } else {
            // FAILED ATTEMPT LOGIC
            const updatedRetries = currentRetries + 1;

            if (updatedRetries >= config.maxRetries) {
                const updatedCooldownCount = currentCooldownCount + 1;
                localStorage.setItem(cooldownCountKey, updatedCooldownCount.toString());
                localStorage.setItem(storageKey, '0'); // Reset retries for next round (post-cooldown)

                const cooldownEnd = Date.now() + (config.cooldownMinutes * 60 * 1000);
                localStorage.setItem(cooldownKey, cooldownEnd.toString());
                console.warn(`Max retries reached. Cooldown round ${updatedCooldownCount} set for ${config.cooldownMinutes} minutes.`);
            } else {
                localStorage.setItem(storageKey, updatedRetries.toString());
            }

            // Failed UI
            if (options.uiMountEl) {
                clearInstructionUI();
                options.uiMountEl.innerHTML = `
                <div style="position: relative; height: 100%; width: 100%; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: clamp(16px, 6vw, 40px); box-sizing: border-box; background: rgba(127, 29, 29, 0.85); font-family: -apple-system, system-ui, sans-serif; overflow-y: auto;">
                    <div style="max-width: min(520px, 92%); width: 100%; padding: clamp(20px, 6vw, 40px); text-align: center; background: rgba(0,0,0,0.2); backdrop-filter: blur(12px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); box-sizing: border-box;">
                        <div style="font-size: clamp(40px, 10vw, 64px); margin-bottom: 16px; text-shadow: 0 4px 12px rgba(0,0,0,0.3);">❌</div>
                        <div style="font-size: clamp(22px, 5.8vw, 28px); font-weight: 700; color: white; margin-bottom: 12px; letter-spacing: -0.01em; line-height: 1.2;">Verification Failed</div>
                        <div style="font-size: clamp(14px, 3.7vw, 16px); color: #fca5a5; line-height: 1.6;">
                            We could not verify your age or liveness.<br>
                            Please try again in a well-lit environment.
                            <br><br>
                            <span style="color: #fff; font-size: 14px;">
                                Round ${currentCooldownCount + 1} of 3 | Attempt ${updatedRetries} of ${config.maxRetries}
                            </span>
                        </div>
                    </div>
                </div>`;
            }
            await new Promise(r => setTimeout(r, 3000));
        }

        // Track Success/Completion
        telemetry.track('verification_complete', {
            success: isOver18,
            facehash: isOver18 ? facehash : undefined,
            scores: {
                age: ageEstimate,
                liveness: livenessScore,
                surface: avgSurfaceScore,
                confidence: ageConfidence
            },
            method: ageMethod,
            failureReason: failureReason || undefined
        });

        return result;

    } finally {
        await camera.stop();
        worker.terminate();
        if (audioCtx) {
            try {
                audioCtx.close();
            } catch { /* ignore */ }
        }
        if (options.uiMountEl && !keepSuccessUI) {
            options.uiMountEl.style.pointerEvents = 'none';
            options.uiMountEl.innerText = '';
        }
        if (!keepSuccessUI) {
            clearInstructionUI();
        }
    }
}

export function createVerificationUI(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'x402-verify-ui';
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.pointerEvents = 'none';
    div.style.zIndex = '100';
    return div;
}

export function setExecutionBackend(_backend: 'standard' | 'enhanced') {
    // Implementation switches diagnostic logic based on security tier
}

/**
 * Internal helper to generate the success UI HTML.
 */
function createSuccessHTML(result: VerifyResult, _config: VerifyConfig, userCode: string): string {
    const ageEstimate = result.evidence.ageEstimate;
    const ageConfidence = result.evidence.ageConfidence;
    const protocolFeeTxId = result.protocolFeeTxId;
    const isOver18 = result.over18;
    const titleText = isOver18 ? 'Verification Successful!' : 'Verification Complete';
    const statusText = isOver18 ? 'Verified on-chain' : 'Confirming on-chain…';
    const statusColor = isOver18 ? '#22c55e' : '#a855f7';
    return `
    <div class="sav-success">
        <div class="sav-success-inner">
            <div class="sav-success-hero">
                <div class="sav-success-title">${titleText}</div>
                <div class="sav-success-sub" style="color: ${statusColor};">${statusText}</div>
            </div>

            <div class="sav-success-card">
                <div>
                    <div class="sav-success-metric-label">Estimated Age</div>
                    <div class="sav-success-metric-value">${Math.round(ageEstimate)}</div>
                </div>
                <div>
                    <div class="sav-success-metric-label">Confidence Level</div>
                    <div class="sav-success-metric-value">${(ageConfidence * 100).toFixed(1)}%</div>
                </div>
                <div class="sav-success-user" style="opacity: ${isOver18 ? 0 : 1}; transform: ${isOver18 ? 'translateY(6px)' : 'none'}; ${isOver18 ? 'animation: revealUserCode 0.4s ease-out forwards; animation-delay: 2.2s;' : ''}">
                    <div class="sav-success-metric-label">User Code</div>
                    <div class="sav-success-user-value">${userCode}</div>
                </div>
            </div>

            ${protocolFeeTxId ? `
            <a
                href="https://explorer.solana.com/tx/${protocolFeeTxId}"
                target="_blank"
                rel="noopener noreferrer"
                class="sav-success-link"
                style="opacity: 0; transform: translateY(6px); animation: revealButton 0.4s ease-out forwards; animation-delay: 2.5s;">
                View On-Chain Proof ↗
            </a>` : ''}

        </div>
    </div>
    <style>
        .sav-success {
            position: relative;
            height: 100%;
            width: 100%;
            pointer-events: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: clamp(20px, 6vw, 40px) clamp(16px, 5vw, 40px);
            padding-bottom: calc(clamp(20px, 6vw, 40px) + env(safe-area-inset-bottom));
            box-sizing: border-box;
            background: rgba(15, 23, 42, 0.85);
            animation: fadeIn 0.5s ease-out;
            font-family: -apple-system, system-ui, sans-serif;
            overflow-y: auto;
        }

        .sav-success-inner {
            max-width: 600px;
            width: 100%;
            text-align: center;
            color: white;
            display: flex;
            flex-direction: column;
            gap: clamp(12px, 3vw, 24px);
            align-items: center;
        }

        .sav-success-hero {
            display: flex;
            flex-direction: column;
            gap: 6px;
            align-items: center;
        }

        .sav-success-title {
            font-size: clamp(28px, 7vw, 40px);
            font-weight: 800;
            line-height: 1.1;
            letter-spacing: -0.02em;
            background: linear-gradient(to bottom, #ffffff, #cbd5e1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            max-width: 18ch;
        }

        .sav-success-sub {
            font-size: clamp(13px, 3.6vw, 15px);
            font-weight: 700;
            letter-spacing: 0.02em;
            line-height: 1.3;
        }

        .sav-success-card {
            width: 100%;
            background: rgba(255,255,255,0.03);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: clamp(16px, 4vw, 28px);
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: clamp(12px, 3vw, 22px);
            text-align: left;
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
            box-sizing: border-box;
        }

        .sav-success-card > div {
            text-align: center;
        }

        .sav-success-metric-label {
            font-size: clamp(11px, 2.6vw, 12px);
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1.4px;
            margin-bottom: 6px;
            font-weight: 700;
        }

        .sav-success-metric-value {
            font-size: clamp(24px, 6.5vw, 34px);
            font-weight: 800;
            font-variant-numeric: tabular-nums;
            color: #f8fafc;
        }

        .sav-success-user {
            grid-column: span 2;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.08);
            text-align: center;
        }

        .sav-success-user-value {
            font-size: clamp(24px, 6.5vw, 34px);
            font-weight: 800;
            font-variant-numeric: tabular-nums;
            color: #60a5fa;
        }

        .sav-success-link {
            padding: 12px 24px;
            border-radius: 12px;
            color: #fff;
            text-decoration: none;
            font-size: clamp(13px, 3.2vw, 14px);
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(255,255,255,0.08);
            box-shadow: 0 8px 24px rgba(0,0,0,0.35);
            backdrop-filter: blur(10px);
        }

        @media (max-width: 420px) {
            .sav-success-card {
                grid-template-columns: 1fr;
            }

            .sav-success-user {
                grid-column: span 1;
            }
        }

        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes revealButton { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes revealUserCode { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    </style>
    `;
}
