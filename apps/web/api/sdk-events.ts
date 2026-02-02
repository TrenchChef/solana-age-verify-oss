import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel Serverless Function to collect SDK telemetry
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. CORS Headers - Allow Any Origin (Since this is for a public SDK)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // 2. Handle OPTIONS Pre-flight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const body = req.body;
        const { eventType, domain, sdkVersion } = body;

        console.log(`[SDK Telemetry] ${eventType} from ${domain} (v${sdkVersion})`);

        // Log "Interesting" info to Vercel logs
        if (eventType === 'verification_failed') {
            console.warn(`[SDK Failure] ${domain} - ${body.payload?.reason || 'Unknown'}`);
        }
        if (eventType === 'verification_complete') {
            console.log(`[SDK Success] ${domain} - Age: ${body.payload?.scores?.age}`);
        }

        // TODO: In the future, send this to PostHog, Supabase, or Mixpanel here.
        // For now, Vercel Logs are the "database".

        return res.status(200).json({ status: 'ok' });
    } catch (e: unknown) {
        console.error('Telemetry Error:', e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
