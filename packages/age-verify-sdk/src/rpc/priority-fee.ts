import { Connection, PublicKey } from '@solana/web3.js';

export interface PriorityFeeResponse {
    context: { slot: number };
    percents: {
        [key: string]: number;
    };
    recommended: number;
}

/**
 * Fetches priority fee estimates from QuickNode's specialized API.
 * This requires the QuickNode Priority Fee add-on to be enabled.
 */
export async function getQuickNodePriorityFee(
    connection: (Connection & { _rpcRequest: Function }) | Connection,
    account: string | PublicKey
): Promise<number> {
    const accountStr = typeof account === 'string' ? account : account.toBase58();

    try {
        // qn_estimatePriorityFees expects: { account: string }
        // We use the 'recommended' slot which is usually safe for quick landing.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await (connection as any)._rpcRequest('qn_estimatePriorityFees', [
            {
                account: accountStr,
                last_n_blocks: 10
            }
        ]);

        if (response.result && response.result.recommended) {
            return response.result.recommended;
        }

        // Only warn if it's NOT a "Method not found" error. 
        // If it is -32601, we just silently fall back to the default.
        if (response.error && response.error.code !== -32601) {
            console.warn('QuickNode Priority Fee API returned unexpected format or error:', response.error);
        }
    } catch (e: any) {
        // Only log if it's not a standard RPC rejection
        if (!e.message?.includes('Method not found') && !e.message?.includes('-32601')) {
            console.warn('Failed to fetch QuickNode Priority Fee:', e);
        }
    }

    // Fallback to a reasonable default if API fails (100k micro-lamports)
    return 100000;
}
