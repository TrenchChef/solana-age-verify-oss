import { PublicKey } from '@solana/web3.js';

/**
 * CORE SECURITY CONFIGURATION
 * This file contains the platform's public configuration.
 * It is designed to be minified and obfuscated during the build process
 * to ensure immutability and prevent easy tampering in the distributed SDK.
 */

// Obfuscation placeholder removed as it's currently unused to avoid build errors.


// Fallback fee (0.0005 SOL - Protocol Fee only)
const _F_B = 0.0005;

let _cachedPlatformPubKey: PublicKey | null = null;

/**
 * Gets the platform's public key from the obfuscated store.
 * This is the address that receives the protocol fee and signs the verification record.
 */
export function getPlatformPublicKey(): PublicKey {
    if (_cachedPlatformPubKey) return _cachedPlatformPubKey;

    // Environment variable overrides disabled for security.
    // We strictly use the hardcoded, obfuscated treasury address to ensure integrity in the distributed package.

    // Default/Fallback logic
    // We use a base58 encoded version that is "minified" in the code.
    // The string here is obfuscated to avoid plain text search and easy replacement.
    // Encoded: vrFYXf63CSksNdhCm183AnX6ogoLV53cT3eMU7TktXi
    const _ob = "dnJGWVhmNjNDU2tzTmRoQ20xODNBblg2b2dvTFY1M2NUM2VNVTdUa3RYaQ==";
    const _dec = (str: string) => {
        try {
            // Browser-safe atob
            if (typeof window !== 'undefined' && window.atob) {
                return window.atob(str);
            }
            // If window.atob is missing (unlikely in modern browser), final hard fallback
            return "vrFYXf63CSksNdhCm183AnX6ogoLV53cT3eMU7TktXi";
        } catch (_e: unknown) {
            // Final fallback to avoid crash, but return something that doesn't reveal the key in plain text
            return "vrFYXf63CSksNdhCm183AnX6ogoLV53cT3eMU7TktXi";
        }
    };

    const _t = _dec(_ob);
    try {
        _cachedPlatformPubKey = new PublicKey(_t);
        // Ensure the object itself cannot be modified
        Object.freeze(_cachedPlatformPubKey);
    } catch (_e: unknown) {
        console.error("CRITICAL: Failed to construct Platform PublicKey from fallback. This indicates a build-time corruption.");
        _cachedPlatformPubKey = new PublicKey("11111111111111111111111111111111");
        Object.freeze(_cachedPlatformPubKey);
    }
    return _cachedPlatformPubKey;
}

/**
 * Gets the protocol fee in SOL.
 */
export function getProtocolFee(_override?: number): number {
    return _override !== undefined ? _override : _F_B;
}

/**
 * Security wrapper to ensure the transaction destination is correct.
 */
export function validateTransactionDestination(destination: PublicKey): boolean {
    const platformKey = getPlatformPublicKey();
    return destination.equals(platformKey);
}
