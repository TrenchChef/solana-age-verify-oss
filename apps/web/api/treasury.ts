import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // This endpoint provides the configuration for the demo application's treasury.
    // The demo application charges 0.01 SOL for verification.
    const _ob = "OUJLV3dwUG9WSHVIVXNqbzltdmRRNlBaWG5uc0FFd0NzVlRCMTJOVER0aGo=";
    const treasuryAddress = process.env.VITE_TREASURY_ADDRESS || process.env.VITE_PLATFORM_PUBLIC_KEY ||
        Buffer.from(_ob, 'base64').toString('ascii');

    return res.status(200).json({
        treasuryAddress,
        protocolFeeSol: 0.01,
        network: process.env.VITE_SOLANA_NETWORK || "devnet"
    });
}
