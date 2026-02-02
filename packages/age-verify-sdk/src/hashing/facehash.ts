export async function computeFaceHash(
    walletPubkey: string,
    salt: Uint8Array,
    embedding: number[]
): Promise<string> {
    const encoder = new TextEncoder();
    const prefixBytes = encoder.encode("solana-verify:v1");

    // In production use bs58 to decode. Use raw utf8 bytes of string for now to satisfy mock requirements without extra deps
    const pubkeyBytes = encoder.encode(walletPubkey);

    const embeddingFloat32 = new Float32Array(embedding);
    const embeddingBytes = new Uint8Array(embeddingFloat32.buffer);

    const totalLength = prefixBytes.length + pubkeyBytes.length + salt.length + embeddingBytes.length;
    const msg = new Uint8Array(totalLength);

    let offset = 0;
    msg.set(prefixBytes, offset); offset += prefixBytes.length;
    msg.set(pubkeyBytes, offset); offset += pubkeyBytes.length;
    msg.set(salt, offset); offset += salt.length;
    msg.set(embeddingBytes, offset);

    const hashBuffer = await crypto.subtle.digest('SHA-256', msg);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
}

export function toHex(buffer: Uint8Array): string {
    return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
}
