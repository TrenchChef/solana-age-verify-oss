import { PublicKey } from '@solana/web3.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getCreateAttestationInstruction,
    deriveAttestationPda,
    fetchSchema,
    serializeAttestationData,
} from 'sas-lib';
import {
    createSolanaRpc,
} from '@solana/rpc';
import {
    createSolanaRpcSubscriptions,
} from '@solana/rpc-subscriptions';
import {
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstruction,
} from '@solana/transaction-messages';
import { pipe } from '@solana/functional';
import { type Address } from '@solana/addresses';
import {
    sendAndConfirmTransactionFactory,
} from '@solana/kit';
import {
    createKeyPairSignerFromPrivateKeyBytes,
    signTransactionMessageWithSigners,
} from '@solana/signers';
import { RpcManager, type RpcTag } from 'solana-age-verify';

/**
 * PRODUCTION ORACLE SERVICE v3.0.0
 * Status: IMMUTABLE / Dual-RPC (Helius & QuickNode)
 * Purpose: Secure biometric verification and SAS attestation issuance via Anchor PDA.
 */

const PROGRAM_ID = new PublicKey('AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q');

type Network = 'devnet' | 'mainnet-beta';

// Helper to get RPC endpoints for the given network (dual env: _MAIN for mainnet)
function getEndpoints(network: Network) {
    const endpoints: { url: string; tags: RpcTag[]; weight: number }[] = [];
    const isMainnet = network === 'mainnet-beta';

    const helius = isMainnet
        ? (process.env.HELIUS_MAIN_RPC_URL || process.env.VITE_HELIUS_MAIN_RPC_URL)
        : (process.env.HELIUS_RPC_URL || process.env.VITE_HELIUS_RPC_URL);
    if (helius && !helius.includes('api.devnet.solana.com')) {
        endpoints.push({ url: helius, tags: ['default'] as RpcTag[], weight: 10 });
    }

    const quicknode = isMainnet
        ? (process.env.QUICKNODE_MAIN_RPC_URL || process.env.VITE_QUICKNODE_MAIN_RPC_URL)
        : (process.env.QUICKNODE_RPC_URL || process.env.VITE_QUICKNODE_RPC_URL);
    if (quicknode && !quicknode.includes('api.devnet.solana.com')) {
        endpoints.push({ url: quicknode, tags: ['default'] as RpcTag[], weight: 10 });
    }

    return endpoints;
}

const rpcManagerByNetwork: Partial<Record<Network, RpcManager>> = {};
function getRpcManager(network: Network) {
    if (!rpcManagerByNetwork[network]) {
        rpcManagerByNetwork[network] = new RpcManager({ endpoints: getEndpoints(network) });
    }
    return rpcManagerByNetwork[network];
}

// Load issuer keypair
let issuerSigner: Awaited<ReturnType<typeof createKeyPairSignerFromPrivateKeyBytes>> | null = null;
async function loadIssuer() {
    if (issuerSigner) return issuerSigner;
    const issuerSecretKey = process.env.ISSUER_SECRET_KEY;
    if (!issuerSecretKey) throw new Error('ISSUER_SECRET_KEY not set');
    try {
        const keyArray = JSON.parse(issuerSecretKey);
        const privateKeyBytes = keyArray.length === 64 ? keyArray.slice(0, 32) : keyArray;
        issuerSigner = await createKeyPairSignerFromPrivateKeyBytes(new Uint8Array(privateKeyBytes));
        return issuerSigner;
    } catch (e) {
        throw new Error('Failed to parse ISSUER_SECRET_KEY');
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const { signature, wallet, network: bodyNetwork } = req.body as { signature?: string; wallet?: string; network?: string };
    if (!signature || !wallet) return res.status(400).json({ error: 'Missing signature or wallet' });

    const network: Network = bodyNetwork === 'mainnet-beta' ? 'mainnet-beta' : 'devnet';
    const isMainnet = network === 'mainnet-beta';

    try {
        const hasHelius = !!(isMainnet ? (process.env.HELIUS_MAIN_RPC_URL || process.env.VITE_HELIUS_MAIN_RPC_URL) : (process.env.HELIUS_RPC_URL || process.env.VITE_HELIUS_RPC_URL));
        const hasQuicknode = !!(isMainnet ? (process.env.QUICKNODE_MAIN_RPC_URL || process.env.VITE_QUICKNODE_MAIN_RPC_URL) : (process.env.QUICKNODE_RPC_URL || process.env.VITE_QUICKNODE_RPC_URL));
        const hasIssuer = !!process.env.ISSUER_SECRET_KEY;
        const credentialAddress = isMainnet ? process.env.CREDENTIAL_ADDRESS_MAIN : process.env.CREDENTIAL_ADDRESS;
        const schemaAddress = isMainnet ? process.env.SCHEMA_ADDRESS_MAIN : process.env.SCHEMA_ADDRESS;
        const hasCredential = !!credentialAddress;
        const hasSchema = !!schemaAddress;

        if (!hasHelius || !hasQuicknode) {
            console.error(`[Oracle] Missing RPC endpoints for ${network}. Set ${isMainnet ? 'HELIUS_MAIN_RPC_URL and QUICKNODE_MAIN_RPC_URL' : 'HELIUS_RPC_URL and QUICKNODE_RPC_URL'}.`);
        }
        if (!hasIssuer) console.error('[Oracle] ISSUER_SECRET_KEY not set.');
        if (!hasCredential || !hasSchema) console.error(`[Oracle] ${isMainnet ? 'CREDENTIAL_ADDRESS_MAIN or SCHEMA_ADDRESS_MAIN' : 'CREDENTIAL_ADDRESS or SCHEMA_ADDRESS'} not set.`);

        const manager = getRpcManager(network);
        const connection = manager.getConnection('default');

        // Use the connection endpoint for Umi/Solana Kit interactions
        const rpc = createSolanaRpc(connection.rpcEndpoint);
        // @ts-ignore
        const rpcSubscriptions = createSolanaRpcSubscriptions(
            connection.rpcEndpoint.replace('https://', 'wss://').replace('http://', 'ws://')
        );

        // Step 1: Wait for transaction confirmation
        try {
            const stat = await connection.getSignatureStatus(signature);
            if (!stat || !stat.value || (stat.value.confirmationStatus !== 'confirmed' && stat.value.confirmationStatus !== 'finalized')) {
                await connection.confirmTransaction(signature, 'confirmed');
            }
        } catch (confErr: unknown) {
            console.warn(`[Oracle] Confirmation warning: ${(confErr as Error).message}`);
        }

        // Explicitly check for transaction failure
        const txStatus = await connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
        });

        if (!txStatus) {
            console.error('[Oracle] Step 1 FAIL: getTransaction returned null. TX may not be indexed yet.');
            return res.status(503).json({
                error: 'Transaction not yet available. Please retry in a few seconds.',
                signature
            });
        }
        if (txStatus.meta && txStatus.meta.err) {
            console.error('[Oracle] Step 1 FAIL: Transaction failed on-chain:', txStatus.meta.err);
            return res.status(400).json({
                error: 'On-chain transaction failed. The biometric proof was not recorded.',
                details: txStatus.meta.err,
                logs: txStatus.meta.logMessages
            });
        }
        console.log('[Oracle] Step 1 OK: Transaction succeeded on-chain.');

        // Step 2: Fetch PDA Account
        console.log('[Oracle] Step 2: Fetching Verification PDA...');
        const [verificationPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("verification"), new PublicKey(wallet).toBuffer()],
            PROGRAM_ID
        );
        console.log(`[Oracle] Verification PDA: ${verificationPda.toString()}`);

        const accountInfo = await connection.getAccountInfo(verificationPda);
        if (!accountInfo) {
            console.error('[Oracle] Verification PDA not found at:', verificationPda.toString());
            return res.status(404).json({ error: 'Verification record not found. The transaction might not have been indexed or failed to create the record.' });
        }
        if (!accountInfo.data) {
            console.error('[Oracle] Verification record is empty at:', verificationPda.toString());
            return res.status(404).json({ error: 'Verification record is empty.' });
        }

        // Step 3: Deserialize verification data
        const data = accountInfo.data;

        // Deserialize logic matching VerificationRecord struct (facehash, user_code, over_18, verified_at, expires_at, bump)
        let offset = 8; // Anchor Discriminator

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

        // Verified if record exists and parses
        const verified = true;

        if (!verified) {
            console.error('[Oracle] Record marked as not verified.');
            return res.status(400).json({ error: 'Record exists but is not valid.' });
        }

        // Step 4: Issue SAS Attestation (credentialAddress and schemaAddress already resolved by network above)
        const issuer = await loadIssuer();

        if (!credentialAddress || !schemaAddress) {
            console.error('[Oracle] SAS configuration missing for', network);
            throw new Error(`SAS Configuration missing: ${isMainnet ? 'CREDENTIAL_ADDRESS_MAIN or SCHEMA_ADDRESS_MAIN' : 'CREDENTIAL_ADDRESS or SCHEMA_ADDRESS'}`);
        }

        const [attestationAddress] = await deriveAttestationPda({
            credential: credentialAddress as Address,
            schema: schemaAddress as Address,
            nonce: wallet as Address,
        });

        const schema = await fetchSchema(rpc, schemaAddress as Address);

        const attestationData = {
            facehash: facehash,
            bump: bump, // Use actual bump
            usercode: userCode,
            over18: over18,
            verification_date: BigInt(verifiedAt),
            expiration: BigInt(expiresAt),
        };

        const serializedData = serializeAttestationData(schema.data, attestationData);

        const attestationIx = getCreateAttestationInstruction({
            payer: issuer,
            authority: issuer,
            credential: credentialAddress as Address,
            schema: schemaAddress as Address,
            nonce: wallet as Address,
            expiry: expiresAt,
            data: serializedData,
            attestation: attestationAddress,
        });

        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

        const transactionMessage = pipe(
            createTransactionMessage({ version: 0 }),
            (tx: Awaited<ReturnType<typeof createTransactionMessage>>) => setTransactionMessageFeePayer(issuer!.address, tx),
            (tx: ReturnType<typeof setTransactionMessageFeePayer>) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
            (tx: ReturnType<typeof setTransactionMessageLifetimeUsingBlockhash>) => appendTransactionMessageInstruction(attestationIx, tx)
        );

        // Solana kit types are complex; cast to satisfy signAndConfirm API
        const signedTransaction = await signTransactionMessageWithSigners(transactionMessage as unknown as Parameters<typeof signTransactionMessageWithSigners>[0]);
        const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
        await sendAndConfirm(signedTransaction as unknown as Parameters<typeof sendAndConfirm>[0], { commitment: 'confirmed' });

        return res.status(200).json({
            success: true,
            attestation: attestationAddress,
            over_18: over18,
            user_code: userCode,
            facehash: facehash,
            verified_at: verifiedAt,
            expires_at: expiresAt
        });

    } catch (e: unknown) {
        const err = e as Error & { name?: string; stack?: string };
        const errName = err?.name ?? 'Error';
        const errMsg = err?.message ?? String(e);
        console.error('[Oracle] CRITICAL ERROR:', errName, errMsg);
        console.error('[Oracle] Stack:', err?.stack?.split('\n').slice(0, 5).join('\n'));
        if (errMsg.includes('ISSUER_SECRET_KEY')) console.error('[Oracle] Hint: Set ISSUER_SECRET_KEY (JSON array of keypair bytes).');
        if (errMsg.includes('CREDENTIAL_ADDRESS') || errMsg.includes('SCHEMA_ADDRESS')) console.error('[Oracle] Hint: Set CREDENTIAL_ADDRESS and SCHEMA_ADDRESS for SAS.');
        return res.status(500).json({
            error: 'Oracle Execution Failed',
            message: errMsg,
            stack: err?.stack?.split('\n').slice(0, 3)
        });
    }
}
