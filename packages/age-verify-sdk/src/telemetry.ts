export interface TelemetryEvent {
    eventType: 'init' | 'verification_start' | 'verification_complete' | 'verification_failed' | 'error' | 'verification_skipped_valid';
    domain: string;
    sdkVersion: string;
    timestamp: number;
    walletAddress?: string; // Hashed or partial? Or just the public key if user consented.
    payload?: unknown;
}

export class TelemetryManager {
    private endpoint: string;
    private disabled: boolean;
    private sdkVersion: string = '2.0.0-beta.30'; // ideally imported
    private wallet?: string;

    constructor(endpoint?: string, disabled: boolean = false) {
        this.endpoint = endpoint || '/api/sdk-events';
        this.disabled = disabled;
    }

    public setWallet(wallet: string) {
        this.wallet = wallet;
    }

    public async track(eventType: TelemetryEvent['eventType'], payload?: unknown) {
        if (this.disabled) return;

        // Skip localhost if you want to avoid noise, or keep it for debugging
        const isLocal = typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        // Optional: you might want to track localhost usage too for development stats

        const event: TelemetryEvent = {
            eventType,
            domain: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
            sdkVersion: this.sdkVersion,
            timestamp: Date.now(),
            walletAddress: this.wallet ? this.anonymizeWallet(this.wallet) : undefined,
            payload
        };

        try {
            // Fire and forget (don't await)
            fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event),
                keepalive: true // Ensure it sends even if page unloads
            }).catch(e => {
                // Silently fail, don't break the app
                if (isLocal) console.warn('[SDK Telemetry] Failed to send:', e);
            });
        } catch (e) {
            // Ignore
        }
    }

    private anonymizeWallet(pubkey: string): string {
        // Just return the public key - it's public on-chain data anyway
        // But for privacy "feeling" we could hash it. 
        // For abuse detection, the actual pubkey is useful.
        return pubkey;
    }
}

export const defaultTelemetry = new TelemetryManager();
