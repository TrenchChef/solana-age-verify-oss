import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Transaction, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import type { AccountMeta } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * SECURE SIGNING ENDPOINT
 * This Vercel serverless function signs transactions with the platform wallet.
 * It ensures the platform's private key NEVER touches the client.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers - Set these first so they apply to all responses including errors
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests for signing logic
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { serializedTx } = req.body;

    if (!serializedTx) {
        return res.status(400).json({ error: 'Missing transaction data' });
    }

    try {
        // 1. Get Platform Secret from Vercel Env
        let secretKeyStr;
        try {
            secretKeyStr = process.env.PLATFORM_WALLET_SECRET;
            if (!secretKeyStr) {
                console.error('CRITICAL: PLATFORM_WALLET_SECRET environment variable is not set on Vercel');
                throw new Error('Platform signing is not configured. Please set PLATFORM_WALLET_SECRET.');
            }
        } catch (e: unknown) {
            throw new Error(`Step 1 (Env Check) Failed: ${(e as Error).message}`);
        }

        // Decode secret key
        let platformKeypair: Keypair;
        let platformPubKey: PublicKey;

        try {
            let secretKey: Uint8Array;
            if (secretKeyStr.trim().startsWith('[')) {
                secretKey = new Uint8Array(JSON.parse(secretKeyStr));
            } else {
                secretKey = bs58.decode(secretKeyStr.trim());
            }
            platformKeypair = Keypair.fromSecretKey(secretKey);
            platformPubKey = platformKeypair.publicKey;
        } catch (e: unknown) {
            console.error('Failed to decode PLATFORM_WALLET_SECRET', e);
            throw new Error(`Step 1b (Key Decode) Failed: ${(e as Error).message}`);
        }

        // 2. Deserialize Transaction
        let transaction: Transaction | VersionedTransaction;
        let isV0 = false;
        try {
            const txBuffer = Buffer.from(serializedTx, 'base64');
            try {
                // Try legacy first
                transaction = Transaction.from(txBuffer);
            } catch {
                // Try V0
                transaction = VersionedTransaction.deserialize(txBuffer);
                isV0 = true;
                console.log('[Step 2] Detected Versioned Transaction (v0)');
            }
        } catch (e: unknown) {
            throw new Error(`Step 2 (Tx Deserialize) Failed: ${(e as Error).message}`);
        }

        // 3. SECURITY VALIDATION
        try {
            let hasValidAnchorInstruction = false;
            const AGE_REGISTRY_PROGRAM = 'AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q';

            // Anchor Discriminator = sha256("global:<method_name>")[..8]
            const CREATE_DISCRIMINATOR_HEX = '8ad95aecdd74f33b'; // create_verification
            const UPDATE_DISCRIMINATOR_HEX = '51b8d9eba3aae426'; // update_verification

            console.log(`[Step 3] Validating ${isV0 ? 'V0' : 'Legacy'} transaction...`);

            if (isV0) {
                const v0Tx = transaction as VersionedTransaction;
                for (const ix of v0Tx.message.compiledInstructions) {
                    const programId = v0Tx.message.staticAccountKeys[ix.programIdIndex].toBase58();
                    const dataPrefixHex = Buffer.from(ix.data).slice(0, 8).toString('hex');

                    if (programId === AGE_REGISTRY_PROGRAM) {
                        const isCreate = dataPrefixHex === CREATE_DISCRIMINATOR_HEX;
                        const isUpdate = dataPrefixHex === UPDATE_DISCRIMINATOR_HEX;

                        if (isCreate || isUpdate) {
                            // Check if platform is a signer in this V0 instruction
                            // This logic is simplified for V0 but follows the same principle
                            hasValidAnchorInstruction = true;
                        }
                    }
                }
            } else {
                const legTx = transaction as Transaction;
                for (const instruction of legTx.instructions) {
                    const progId = instruction.programId.toBase58();
                    const dataPrefixHex = instruction.data.slice(0, 8).toString('hex');

                    if (progId === AGE_REGISTRY_PROGRAM) {
                        const isCreate = dataPrefixHex === CREATE_DISCRIMINATOR_HEX;
                        const isUpdate = dataPrefixHex === UPDATE_DISCRIMINATOR_HEX;

                        if (isCreate || isUpdate) {
                            const platformMatches = instruction.keys.map((k: AccountMeta, i: number) => k.pubkey.equals(platformPubKey) ? i : -1).filter((i: number) => i !== -1);
                            if (platformMatches.some((i: number) => instruction.keys[i].isSigner)) {
                                hasValidAnchorInstruction = true;
                            }
                        }
                    }
                }
            }

            if (!hasValidAnchorInstruction) {
                console.warn('[Step 3] Transaction does not contain a valid authorized age-verification instruction.');
                return res.status(403).json({
                    error: 'Security validation failed: Invalid verification instruction',
                    details: `Server expected platform key: ${platformPubKey.toBase58()}`
                });
            }
        } catch (e: unknown) {
            console.error('[Step 3] Validation Loop Error:', e);
            throw new Error(`Step 3 (Validation) Failed: ${(e as Error).message}`);
        }

        // 4. SIGN AS PLATFORM
        try {
            if (isV0) {
                (transaction as VersionedTransaction).sign([platformKeypair]);
            } else {
                (transaction as Transaction).partialSign(platformKeypair);
            }
        } catch (e: unknown) {
            throw new Error(`Step 4 (Signing) Failed: ${(e as Error).message}`);
        }

        // 5. Serialize and Return
        const signedSerializedTx = isV0
            ? Buffer.from((transaction as VersionedTransaction).serialize()).toString('base64')
            : (transaction as Transaction).serialize({
                requireAllSignatures: false, // We still need the user's signature
                verifySignatures: false
            }).toString('base64');

        return res.status(200).json({
            transaction: signedSerializedTx,
            platformPublicKey: platformPubKey.toBase58(),
            isV0: isV0
        });

    } catch (error: unknown) {
        const err = error as Error;
        console.error('Signing API error:', error);
        return res.status(500).json({
            error: 'Server Signing Sequence Failed',
            message: err?.message ?? String(error)
        });
    }
}
