import { Connection, PublicKey, ParsedInstruction } from '@solana/web3.js';
import { getPlatformPublicKey } from './security';
import { deriveVerificationPda, parseVerificationRecord } from './types';

export interface VerificationCredential {
    over18: boolean;
    facehash: string;
    usercode: string;
    bump: number;
    verification_date: number;
    expiration: number;
}

export interface ValidationResult {
    isVerified: boolean;
    verifiedAt: number | null;
    faceHash: string | null;
    transactionSignature: string | null;
    verificationTier: 'standard' | 'unknown';
}

/**
 * Checks the on-chain verification status of a wallet.
 * Scans recent transactions for a valid payment to the Official Treasury with the correct Memo.
 * 
 * @param connection Solana Connection object
 * @param walletPubkey The user's public key to check
 * @returns ValidationResult object
 */
export async function checkVerificationStatus(
    connection: Connection,
    walletPubkey: PublicKey
): Promise<ValidationResult> {
    try {
        const platformTreasury = getPlatformPublicKey();
        const MEMO_PROGRAM_ID = 'MemoSq4gqABAXib96qFbncnscymPme7yS4AtGf4Vb7';

        // Fetch recent transaction signatures (limit to 50 for performance)
        const signatures = await connection.getSignaturesForAddress(walletPubkey, { limit: 50 });

        if (signatures.length === 0) {
            return { isVerified: false, verifiedAt: null, faceHash: null, transactionSignature: null, verificationTier: 'unknown' };
        }

        // Fetch parsed details for these transactions
        // batch requests to avoid rate limits if possible, but getParsedTransactions is cleaner
        const sigsToFetch = signatures.map(s => s.signature);
        const txs = await connection.getParsedTransactions(sigsToFetch, { maxSupportedTransactionVersion: 0 });

        for (const tx of txs) {
            if (!tx || !tx.meta || tx.meta.err) continue;

            const instructions = tx.transaction.message.instructions;
            let paidTreasury = false;
            let hasMemo = false;
            let faceHash: string | null = null;

            for (const ix of instructions) {
                // 1. Check for Payment to Treasury (System Program Transfer)
                if (ix.programId.toBase58() === '11111111111111111111111111111111') { // System Program
                    if ('parsed' in ix) {
                        const parsed = (ix as ParsedInstruction).parsed;
                        if (parsed.type === 'transfer') {
                            const info = parsed.info;
                            // Check if destination is Treasury AND amount is at least 0.001 SOL (1,000,000 lamports)
                            if (info.destination === platformTreasury.toBase58() && info.lamports >= 1000000) {
                                paidTreasury = true;
                            }
                        }
                    }
                }

                // 2. Check for Validation Memo
                if (ix.programId.toBase58() === MEMO_PROGRAM_ID) {
                    // Try to parse the memo string
                    let memoText = '';

                    if ('parsed' in ix) {
                        // Standard RPC parsing often puts the string directly in `parsed`
                        const p = (ix as ParsedInstruction).parsed;
                        if (typeof p === 'string') {
                            memoText = p;
                        }
                        // Sometimes it's a JSON object depending on RPC config? rarely for Memo.
                    }
                    // Fallback to searching decoded data logs if needed? 
                    // Usually getParsedTransactions handles Memo quite well.

                    if (memoText && memoText.includes('SAV:')) {
                        // Memo Format: "Verified Age 25+ (SAV:hash) ..."
                        // We strictly look for "SAV:"
                        const parts = memoText.split('SAV:');
                        if (parts.length > 1) {
                            hasMemo = true;
                            // Extract hash (alphanumeric until space or end)
                            const afterPrefix = parts[1].trim();
                            faceHash = afterPrefix.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
                        }
                    }
                }
            }

            // If both conditions met in the same transaction, IT IS VALID.
            if (paidTreasury && hasMemo && faceHash) {
                return {
                    isVerified: true,
                    verifiedAt: tx.blockTime ? tx.blockTime * 1000 : null,
                    faceHash: faceHash,
                    transactionSignature: tx.transaction.signatures[0],
                    verificationTier: 'standard'
                };
            }
        }

        // If loop finishes without returning, no valid verification found in recent history.
        return {
            isVerified: false,
            verifiedAt: null,
            faceHash: null,
            transactionSignature: null,
            verificationTier: 'unknown'
        };

    } catch (e) {
        console.error("SolanaAgeVerify: checkVerificationStatus failed", e);
        // Fail graceful check
        return { isVerified: false, verifiedAt: null, faceHash: null, transactionSignature: null, verificationTier: 'unknown' };
    }
}

/**
 * Fetches the PDA-based verification record for a user.
 */
export async function fetchCredential(
    connection: Connection,
    userPublicKey: PublicKey
): Promise<VerificationCredential | null> {
    try {
        const [verificationPda] = deriveVerificationPda(userPublicKey);
        const accountInfo = await connection.getAccountInfo(verificationPda);
        if (!accountInfo?.data) return null;

        const record = parseVerificationRecord(Buffer.from(accountInfo.data));

        return {
            over18: record.over18,
            facehash: record.facehash,
            usercode: record.userCode,
            verification_date: record.verifiedAt,
            expiration: record.expiresAt,
            bump: record.bump
        };
    } catch (e) {
        console.error("fetchCredential failed:", e);
        return null;
    }
}

export async function checkExistingVerification(
    connection: Connection,
    userPublicKey: PublicKey
): Promise<VerificationCredential | null> {
    return fetchCredential(connection, userPublicKey);
}

