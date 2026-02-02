import { Header } from './App';

export default function Help({ onBack }: { onBack: () => void }) {
    return (
        <div style={{
            minHeight: '100vh',
            paddingTop: '120px',
            paddingBottom: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            <Header />
            <div className="glass glass-shadow animate-fade-in" style={{
                maxWidth: '800px',
                width: '90%',
                padding: '40px',
                borderRadius: '24px',
                lineHeight: '1.6',
                color: 'var(--text-dim)'
            }}>
                <h1 className="gradient-text" style={{ fontSize: '36px', marginBottom: '24px' }}>Help Center</h1>

                {/* Privacy-Preserving Technologies Highlight */}
                <div className="glass" style={{
                    padding: '24px',
                    borderRadius: '16px',
                    border: '2px solid var(--primary)',
                    background: 'rgba(20, 241, 149, 0.05)',
                    marginBottom: '32px'
                }}>
                    <h2 style={{ color: 'var(--primary)', marginTop: '0', marginBottom: '16px', fontSize: '20px' }}>🔒 Privacy-First Architecture</h2>
                    <p style={{ marginBottom: '12px' }}><strong>Zero-Knowledge Biometrics:</strong> Your face never leaves your device. All AI processing happens locally in your browser using WebAssembly.</p>
                    <p style={{ marginBottom: '12px' }}><strong>On-Chain Record:</strong> We store a verification record on-chain as a standard PDA tied to your wallet.</p>
                    <p style={{ marginBottom: '0' }}><strong>No Personal Data:</strong> We only record a cryptographic hash (facehash) and age verification status. No images, videos, or identifiable biometric templates are ever stored.</p>
                </div>

                {/* Cross-Platform Verification Highlight */}
                <div className="glass" style={{
                    padding: '24px',
                    borderRadius: '16px',
                    border: '2px solid #3b82f6',
                    background: 'rgba(59, 130, 246, 0.05)',
                    marginBottom: '32px'
                }}>
                    <h2 style={{ color: '#60a5fa', marginTop: '0', marginBottom: '16px', fontSize: '20px' }}>🌐 Verify Once, Use Everywhere</h2>
                    <p style={{ marginBottom: '12px' }}><strong>Universal Verification:</strong> Once you verify your age on any participating partner site, your status is recorded on the Solana blockchain and instantly recognized by <strong>all</strong> partners in our network.</p>
                    <p style={{ marginBottom: '0' }}><strong>Zero Friction:</strong> No need to re-scan your face or pay fees again when visiting a new dApp. As long as your verification hasn't expired, you get instant access across the ecosystem.</p>
                </div>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>How it works?</h2>
                <p>Solana Age Verify uses advanced computer vision and liveness detection to estimate your age directly in your browser. After successful verification, you get an on-chain verification record plus a SAS (Solana Attestation Service) credential issued by the Oracle.</p>
                <p style={{ marginTop: '12px' }}><strong>The Process:</strong></p>
                <ol style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li>Connect your Solana wallet</li>
                    <li>Complete biometric liveness challenges (active gestures + passive surface checks, all processed locally)</li>
                    <li>Receive on-chain verification record and SAS credential</li>
                    <li>Get a unique 5-character user code (adults only) for easy verification</li>
                </ol>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>What is a SAS credential?</h2>
                <p>SAS credentials are cryptographically signed attestations stored on Solana using the Solana Attestation Service standard. Your age verification credential contains:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Facehash:</strong> A unique cryptographic hash (not reversible)</li>
                    <li><strong>User Code:</strong> 5-character alphanumeric code (e.g., "XP79K") - generated only for verified adults</li>
                    <li><strong>Age Status:</strong> Boolean flag indicating 18+ status</li>
                    <li><strong>Expiry:</strong> 90 days for adults, 30 days for under-18 users</li>
                    <li><strong>Oracle Signature:</strong> Cryptographic proof issued by our verification service</li>
                </ul>
                <p style={{ marginTop: '12px' }}>This credential can be verified by any Solana application that integrates with our SDK, enabling seamless age-gated access across the ecosystem.</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>What is stored on-chain?</h2>
                <p>We store a minimal verification record tied to your wallet, plus a SAS credential issued by the Oracle:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Verification Record:</strong> A PDA containing facehash, age status, user code (adults only), and expiration.</li>
                    <li><strong>SAS Credential:</strong> An attestation that can be verified by any partner app.</li>
                    <li><strong>Privacy:</strong> No images, video, or raw biometric data are ever stored on-chain.</li>
                    <li><strong>Security:</strong> All records are cryptographically verifiable and public.</li>
                </ul>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>Why did it fail?</h2>
                <p>Verification might fail if:</p>
                <ul style={{ paddingLeft: '20px' }}>
                    <li>Lighting is too poor (too dark or too much backlight)</li>
                    <li>Your face is partially covered (glasses, hats, hands)</li>
                    <li>The system cannot confidently estimate your age as 18+</li>
                    <li>You didn't follow the liveness challenges (like nodding or turning)</li>
                    <li>Your camera is blocked or permissions not granted</li>
                </ul>
                <p style={{ marginTop: '12px' }}><strong>Tip:</strong> Ensure good lighting, center your face, and follow instructions carefully for best results.</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>What is the fee?</h2>
                <div className="glass" style={{ padding: '20px', borderRadius: '12px', marginTop: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ marginBottom: '12px' }}><strong>Fee Breakdown:</strong></p>
                <ul style={{ paddingLeft: '20px', margin: '0', listStyle: 'none' }}>
                    <li style={{ marginBottom: '8px' }}>• <strong>Protocol Fee:</strong> <span style={{ color: 'var(--primary)' }}>0.0005 SOL</span> (fixed base fee for on-chain recording + PDA creation)</li>
                    <li style={{ marginBottom: '8px' }}>• <strong>Network Fees:</strong> <span style={{ color: 'var(--primary)' }}>~0.001 SOL</span> (transaction fees)</li>
                    <li style={{ marginBottom: '8px' }}>• <strong>Application Fee:</strong> <span style={{ color: 'var(--primary)' }}>0.001 SOL</span> (this demo app's service fee)</li>
                    <li style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '8px' }}><strong>Total Cost:</strong> <span style={{ color: 'var(--primary)', fontSize: '18px' }}>~0.003 SOL</span></li>
                </ul>
                <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-dim)' }}>The protocol fee is fixed in the protocol; the in-app display reflects current amounts.</p>
            </div>
                <p style={{ marginTop: '12px', fontSize: '14px' }}>On-chain records are kept minimal to keep costs low and verification accessible.</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>About User Codes</h2>
                <p>Upon successful verification as an adult (18+), you'll receive a unique 5-character alphanumeric code (e.g., "XP79K"). This code:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li>Acts as a human-readable proof of verification</li>
                    <li>Is only generated for verified adults (not for under-18 users)</li>
                    <li>Can be shared to prove your verified status</li>
                    <li>Is permanently tied to your wallet and facehash</li>
                    <li>Expires after 90 days (requires re-verification)</li>
                </ul>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>How do I get test SOL?</h2>
                <p>For testing, you can get free test SOL using these Devnet faucets:</p>
                <ul style={{ paddingLeft: '20px' }}>
                    <li><strong>Solana Faucet:</strong> Visit <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>faucet.solana.com</a> and enter your wallet address</li>
                    <li><strong>QuickNode Faucet:</strong> Use <a href="https://faucet.quicknode.com/solana/devnet" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>QuickNode's Devnet faucet</a></li>
                    <li><strong>Wallet Command:</strong> If using Solana CLI: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>solana airdrop 2 YOUR_ADDRESS --url devnet</code></li>
                </ul>
                <p style={{ marginTop: '12px', fontSize: '14px', fontStyle: 'italic' }}>Note: Devnet SOL has no real value and is only for testing purposes.</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>Is my data safe?</h2>
                <p><strong>Absolutely.</strong> We implement multiple layers of privacy protection:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Local Processing:</strong> All AI models run in your browser via WebAssembly. Your face never leaves your device.</li>
                    <li><strong>On-Chain Record:</strong> We store only cryptographic outputs (facehash, status, timestamps), not raw data.</li>
                    <li><strong>One-Way Hashing:</strong> The facehash cannot be reversed to reconstruct your face.</li>
                    <li><strong>No Servers:</strong> We never receive, process, or store facial images on any server.</li>
                    <li><strong>Open Source:</strong> Our code is publicly auditable on GitHub.</li>
                </ul>
                <p style={{ marginTop: '12px' }}><strong>What we store on-chain:</strong> Only your wallet address, facehash, age verification status, user code (if adult), and expiry timestamp. No personally identifiable information (PII).</p>

                <div style={{ marginTop: '40px' }}>
                    <button
                        onClick={onBack}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
