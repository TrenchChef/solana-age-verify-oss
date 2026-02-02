
interface WikiProps {
    onBack: () => void;
}

const Wiki = ({ onBack }: WikiProps) => {
    return (
        <div className="animate-fade-in" style={{
            width: '100%',
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '40px 20px 100px',
            color: 'var(--text-main)',
            position: 'relative'
        }}>

            <div style={{ marginTop: '40px', marginBottom: '60px' }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-dim)',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                    ← Back to Demo
                </button>
            </div>

            <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                    <img src="/images/AgeVerify-App-Logo-512.png" alt="Solana Age Verify" style={{ width: '64px', height: '64px', borderRadius: '16px' }} />
                    <h1 style={{ fontSize: '48px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
                        Developer <span className="gradient-text">Documentation</span>
                    </h1>
                </div>
                <p style={{ fontSize: '18px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '48px', maxWidth: '700px' }}>
                    Integrate biometric age verification into your Solana application in minutes. Privacy-safe, on-chain, and run entirely in the browser.
                </p>

                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        What is Solana Age Verify?
                    </h2>
                    <p style={{ fontSize: '16px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '24px' }}>
                        <strong>Solana Age Verify</strong> is a privacy-first biometric identity primitive built specifically for the Solana ecosystem. It enables developers to gate content or services based on age (&gt;18) without ever handling, storing, or seeing raw facial data.
                    </p>
                    <p style={{ fontSize: '16px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '12px' }}>
                        <strong>Privacy-Preserving Technologies:</strong>
                    </p>
                    <ul style={{ fontSize: '16px', color: 'var(--text-dim)', lineHeight: '1.6', marginLeft: '20px', marginBottom: '12px' }}>
                        <li><strong>Zero-Knowledge Biometrics:</strong> All AI processing happens in-browser via WebAssembly. Your users' faces never leave their devices.</li>
                        <li><strong>On-Chain Record:</strong> Verification data is stored on-chain as a PDA tied to the user's wallet, with SAS credentials issued by the Oracle.</li>
                        <li><strong>SAS Standards:</strong> Leverages Solana Attestation Service for composable, on-chain proofs that work across the entire ecosystem.</li>
                    </ul>
                    <p style={{ fontSize: '16px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '0' }}>
                        This creates a "KYC-lite" layer for age-restricted dApps without the privacy nightmares of traditional identity systems.
                    </p>
                </section>

                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        Why Developers Choose Solana Age Verify
                    </h2>
                    <p style={{ color: 'var(--text-main)', lineHeight: '1.6', marginBottom: '16px', fontSize: '15px' }}>
                        Integrate institutional-grade age verification in under 5 minutes with a simple React-friendly SDK.
                    </p>
                    <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '24px', fontSize: '15px' }}>
                        Privacy-safe, on-chain, and run entirely in the browser: no passports, no IDs, no credit cards. Just a face scan and a wallet signature.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        {[
                            { title: 'Privacy-First Design', text: 'Zero-knowledge biometrics + PDA-based on-chain records. No face data leaves the user\'s device. No GDPR/CCPA compliance nightmares.' },
                            { title: 'Ultra-Low Cost', text: 'Protocol fee is 0.0005 SOL (+ ~0.001 tx). On-chain records are kept minimal to reduce cost.' },
                            { title: 'Composable Identity', text: 'Uses SAS (Solana Attestation Service) standards, making verifications readable by any protocol on the network.' }
                        ].map((item, i) => (
                            <div key={i} className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--primary)' }}>{item.title}</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.5', margin: 0 }}>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section style={{ marginBottom: '60px' }}>
                    <div className="glass" style={{
                        padding: '40px',
                        borderRadius: '24px',
                        border: '3px solid var(--primary)',
                        background: 'linear-gradient(135deg, rgba(20, 241, 149, 0.1), rgba(59, 130, 246, 0.05))',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '64px', opacity: 0.1 }}>🌐</div>
                        <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)' }}>
                            ✨ Verify Once, Use Everywhere
                        </h2>
                        <p style={{ fontSize: '18px', color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '24px', fontWeight: '500' }}>
                            This is the <strong>killer feature</strong>: Once a wallet verifies on <em>any</em> partner site, that verification is stored on-chain and <strong>works across ALL partners</strong>.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(20, 241, 149, 0.2)' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>1️⃣</div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--primary)' }}>User Verifies Once</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.5', margin: 0 }}>
                                    Alice verifies on Casino dApp X. Verification stored on Solana blockchain.
                                </p>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(20, 241, 149, 0.2)' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>2️⃣</div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--primary)' }}>Instant Recognition</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.5', margin: 0 }}>
                                    Alice visits NFT Marketplace Y. They check her wallet on-chain - already verified!
                                </p>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(20, 241, 149, 0.2)' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>3️⃣</div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--primary)' }}>Zero Friction</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.5', margin: 0 }}>
                                    No re-verification needed. Alice granted instant access based on on-chain proof.
                                </p>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-main)' }}>
                                🔑 For Integrators: Check, Don't Verify
                            </h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '12px' }}>
                                Use the SDK's <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary)' }}>checkExistingVerification()</code> function to see if a wallet already has a PDA verification record. If they do and it is still valid, grant access immediately. If not, prompt them to verify.
                            </p>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                                <li><strong>Network Effect:</strong> As more partners integrate, fewer users need to verify from scratch</li>
                                <li><strong>User Experience:</strong> Returning users across the ecosystem get instant, seamless access</li>
                                <li><strong>Shared Infrastructure:</strong> All partners benefit from a growing verified user base</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        Age Verify vs. Traditional KYC
                    </h2>
                    <div className="glass" style={{ overflow: 'hidden', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                                    <th style={{ padding: '20px', borderBottom: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: '600' }}>Feature</th>
                                    <th style={{ padding: '20px', borderBottom: '1px solid var(--border)', color: 'var(--primary)', fontWeight: '600' }}>Solana Age Verify</th>
                                    <th style={{ padding: '20px', borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', fontWeight: '600' }}>Traditional KYC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { f: 'Verification Speed', a: '10-30 Seconds', k: '2+ Days' },
                                    { f: 'User Data Storage', a: 'Zero (Local RAM Only)', k: 'Centralized PII Database' },
                                    { f: 'Privacy Technology', a: 'PDA Record + Zero-Storage Biometrics', k: 'Full Identity Disclosure' },
                                    { f: 'User Friction', a: 'No IDs/Cards Needed', k: 'Passport/Selfie/Utility Bill' },
                                    { f: 'Protocol Cost (Approx.)', a: '0.0005 SOL (fixed) + ~0.001 tx; demo total ~0.003 SOL', k: '$5.00 - $15.00+' },
                                    { f: 'Composability', a: 'On-Chain SAS Standard', k: 'Siloed Vendor API' },
                                    { f: 'Expiry & Renewal', a: '90 days (auto-renewable)', k: 'Permanent or Annual' }
                                ].map((row, i) => (
                                    <tr key={i} style={{ borderBottom: i === 5 ? 'none' : '1px solid rgba(255, 255, 255, 0.03)' }}>
                                        <td style={{ padding: '20px', color: 'var(--text-main)', fontWeight: '500' }}>{row.f}</td>
                                        <td style={{ padding: '20px', color: 'var(--success)' }}><strong>{row.a}</strong></td>
                                        <td style={{ padding: '20px', color: 'var(--text-dim)' }}>{row.k}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        1. Installation
                    </h2>
                    <p style={{ marginBottom: '16px' }}>Install the SDK via NPM or Yarn:</p>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '20px',
                        borderRadius: '16px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '14px',
                        color: '#94a3b8',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        marginBottom: '24px',
                        position: 'relative'
                    }}>
                        <code style={{ color: 'var(--primary)' }}>npm install solana-age-verify</code>
                        <span style={{ opacity: 0.5 }}> or </span>
                        <code style={{ color: 'var(--primary)' }}>yarn add solana-age-verify</code>
                    </div>
                </section>

                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        2. Configuration (Vite)
                    </h2>
                    <p style={{ marginBottom: '16px', color: 'var(--text-dim)' }}>
                        The SDK requires access to WASM and static assets. Configure your <code style={{ color: 'var(--primary)' }}>vite.config.ts</code> to copy these assets to your build output.
                    </p>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '24px',
                        borderRadius: '16px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        overflowX: 'auto'
                    }}>
                        <pre style={{ margin: 0 }}>{`// vite.config.ts
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/solana-age-verify/public/models/*',
          dest: 'models' // Available at /models
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: '.'
        }
      ]
    })
  ]
});`}</pre>
                    </div>
                </section>

                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        3. Integration
                    </h2>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '24px',
                        borderRadius: '16px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        marginBottom: '24px',
                        overflowX: 'auto'
                    }}>
                        <pre style={{ margin: 0 }}>{`import { verifyHost18Plus } from 'solana-age-verify';
import AgeWorker from 'solana-age-verify/worker?worker';

const handleVerify = async () => {
    const result = await verifyHost18Plus({
        walletPubkeyBase58: wallet.publicKey.toBase58(),
        connection: connection,
        wallet: {
            publicKey: wallet.publicKey,
            signTransaction: wallet.signTransaction
        },
        uiMountEl: document.getElementById('verify-root'),
        workerFactory: () => new AgeWorker(),
        appTreasury: "YOUR_SOLANA_WALLET_ADDRESS"
    });

    if (result.over18 && result.protocolFeeTxId) {
        console.log("Verified! FaceHash:", result.facehash);
        // Call your oracle endpoint to issue a SAS credential
        await fetch('/api/issue-credential', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                signature: result.protocolFeeTxId,
                wallet: wallet.publicKey.toBase58()
            })
        });
    }
}`}</pre>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-main)' }}>
                        SAS Verifiable Credentials
                    </h3>
                    <p style={{ color: 'var(--text-dim)', lineHeight: '1.5', marginBottom: '20px' }}>
                        After on-chain verification, your integration should call our Oracle endpoint to validate the transaction and issue a **SAS (Solana Attestation Service)** credential. This credential can be queried by any dApp using the SAS SDK.
                    </p>
                    <div className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'grid', gap: '8px' }}>
                            <li style={{ fontSize: '14px' }}><strong>Credential:</strong> <code>Agoe9Y98SVFsGE99mtugBSFbE6tKDuyLYsSxW9vuFAhG</code> (Age Verify)</li>
                            <li style={{ fontSize: '14px' }}><strong>Schema:</strong> <code>T5s6DTfqpJYp6SjR6FT4KUYkM11tbxns87hnQkPYsUq</code> (Age_v2)</li>
                        </ul>
                    </div>
                </section>

                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        Core Infrastructure
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(20, 241, 149, 0.2)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: 'var(--primary)' }}>🔒 Zero-Knowledge Biometrics</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                                All facial analysis runs locally in the browser via WebAssembly (WASM). No biometric data is ever transmitted to servers. Your users' privacy is guaranteed by design, not policy.
                            </p>
                        </div>
                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(20, 241, 149, 0.2)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: 'var(--primary)' }}>⚡ On-Chain PDA Record</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                                Verification records are stored as standard PDA accounts, keeping the on-chain footprint minimal while preserving public verifiability.
                            </p>
                        </div>
                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(20, 241, 149, 0.2)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: 'var(--primary)' }}>🌐 Composable SAS Standard</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                                Verifications use Solana Attestation Service standards, making them readable and verifiable by any dApp on Solana. Build once, verify everywhere.
                            </p>
                        </div>
                    </div>
                </section>

                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        FaceHash: Deterministic + Wallet-Bound
                    </h2>
                    <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '16px' }}>
                        FaceHash is a deterministic, privacy-preserving identifier derived from geometric facial landmarks. It is salted and bound to the wallet public key, so the same face on a different wallet yields a different hash. The hash is one-way and cannot be reversed to reconstruct biometric data.
                    </p>
                </section>

                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        Pricing & Fees
                    </h2>
                    <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '2px solid var(--primary)', background: 'rgba(20, 241, 149, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '32px' }}>💎</div>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>Ultra-Low Cost Verification</h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '14px', margin: '4px 0 0' }}>Minimal on-chain record with predictable costs</p>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                            <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '12px', fontWeight: '600' }}>Protocol Fee (Approx.)</p>
                            <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--primary)', marginBottom: '8px' }}>
                                0.0015 <span style={{ fontSize: '24px', fontWeight: '600' }}>SOL</span>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-dim)', margin: '0' }}>Protocol base fee (0.0005 SOL) + network fees (~0.001 SOL)</p>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                            <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '8px' }}><strong>This Demo App Total:</strong></p>
                            <ul style={{ padding: 0, margin: 0, listStyle: 'none', fontSize: '14px', color: 'var(--text-dim)' }}>
                                <li style={{ marginBottom: '6px' }}>• Protocol Fee: <span style={{ color: 'var(--primary)' }}>0.0005 SOL</span></li>
                                <li style={{ marginBottom: '6px' }}>• Network Fees: <span style={{ color: 'var(--primary)' }}>~0.001 SOL</span></li>
                                <li style={{ marginBottom: '6px' }}>• Application Fee: <span style={{ color: 'var(--primary)' }}>0.001 SOL</span></li>
                                <li style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '8px', fontWeight: '600' }}>Total: <span style={{ color: 'var(--primary)', fontSize: '16px' }}>~0.003 SOL</span></li>
                            </ul>
                            <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-dim)', marginBottom: 0 }}>The protocol fee is fixed in the protocol; the in-app display reflects current amounts.</p>
                        </div>

                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'grid', gap: '10px' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-dim)' }}>
                                <span style={{ color: 'var(--success)' }}>✓</span> No setup fees or monthly subscriptions
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-dim)' }}>
                                <span style={{ color: 'var(--success)' }}>✓</span> Integrators set their own application fee (demo uses 0.001 SOL)
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-dim)' }}>
                                <span style={{ color: 'var(--success)' }}>✓</span> Minimal on-chain record keeps storage costs low
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-dim)' }}>
                                <span style={{ color: 'var(--success)' }}>✓</span> Credentials valid for 90 days (adults) or 30 days (under-18)
                            </li>
                        </ul>
                    </div>
                </section>

                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        Deep Dive Resources
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                        <a href={`${import.meta.env.VITE_OSS_REPO_URL || 'https://github.com/TrenchChef/solana-age-verify-sdk'}/blob/main/docs/HOW_AGE_VERIFICATION_WORKS.md`} target="_blank" rel="noopener noreferrer" className="glass" style={{ padding: '20px', borderRadius: '16px', textDecoration: 'none', transition: 'transform 0.2s', border: '1px solid var(--border)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <h3 style={{ fontSize: '16px', color: 'var(--primary)', margin: '0 0 8px' }}>How Verification Works ↗</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>Detailed breakdown of geometric analysis and age estimation logic.</p>
                        </a>
                        <a href={`${import.meta.env.VITE_OSS_REPO_URL || 'https://github.com/TrenchChef/solana-age-verify-sdk'}/blob/main/docs/specs/LIVENESS_DETECTION.md`} target="_blank" rel="noopener noreferrer" className="glass" style={{ padding: '20px', borderRadius: '16px', textDecoration: 'none', transition: 'transform 0.2s', border: '1px solid var(--border)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <h3 style={{ fontSize: '16px', color: 'var(--primary)', margin: '0 0 8px' }}>Liveness & Security ↗</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>Understand our anti-spoofing measures (surface analysis, challenges).</p>
                        </a>
                        <a href={`${import.meta.env.VITE_OSS_REPO_URL || 'https://github.com/TrenchChef/solana-age-verify-sdk'}/blob/main/docs/API_REFERENCE.md`} target="_blank" rel="noopener noreferrer" className="glass" style={{ padding: '20px', borderRadius: '16px', textDecoration: 'none', transition: 'transform 0.2s', border: '1px solid var(--border)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <h3 style={{ fontSize: '16px', color: 'var(--primary)', margin: '0 0 8px' }}>API Reference ↗</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>Full documentation of SDK methods, types, and configuration options.</p>
                        </a>
                    </div>
                </section>

                <section>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                        NPM Registry
                    </h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '24px' }}>
                        The official SDK is published on the NPM registry for public use.
                    </p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <a
                            href="https://www.npmjs.com/package/solana-age-verify"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: '#cb3837',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                fontWeight: '600',
                                transition: 'transform 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            View on NPM Registry
                        </a>

                    </div>
                </section>
            </div>
        </div>
    );
};

export default Wiki;
