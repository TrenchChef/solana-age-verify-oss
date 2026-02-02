import { Header } from './App';

export default function Hackathon({ onBack }: { onBack: () => void }) {
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
                <h1 className="gradient-text" style={{ fontSize: '36px', marginBottom: '24px' }}>Hackathon Submission</h1>

                {/* Hero Section */}
                <div className="glass" style={{
                    padding: '24px',
                    borderRadius: '16px',
                    border: '2px solid var(--primary)',
                    background: 'rgba(20, 241, 149, 0.05)',
                    marginBottom: '32px',
                    textAlign: 'center'
                }}>
                    <h2 style={{ color: 'var(--primary)', marginTop: '0', marginBottom: '16px', fontSize: '24px' }}>Solana AgeVerify</h2>
                    <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-main)', margin: '0 0 16px 0' }}>
                        A privacy-preserving, on-chain age-verification primitive for Solana that proves &quot;18+&quot; without IDs, biometrics, or personal data ever leaving the user&apos;s device.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
                        <a
                            href="https://solana.com/privacyhack"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                padding: '12px 24px',
                                background: 'var(--primary)',
                                color: '#000',
                                borderRadius: '12px',
                                fontWeight: '700',
                                textDecoration: 'none',
                                transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Solana Privacy Hackathon ↗
                        </a>
                        <a
                            href="https://x.com/AVSolana"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                padding: '12px 24px',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'var(--text-main)',
                                borderRadius: '12px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                border: '1px solid rgba(255,255,255,0.2)',
                                transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            @AVSolana ↗
                        </a>
                    </div>
                </div>

                {/* Track Section */}
                <div className="glass" style={{
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                    background: 'rgba(147, 51, 234, 0.08)',
                    marginBottom: '32px'
                }}>
                    <h2 style={{ color: '#a855f7', marginTop: 0, marginBottom: '16px', fontSize: '22px' }}>Track 3: Open Track Pool</h2>
                    <p style={{ color: 'var(--text-main)', marginBottom: '16px' }}>
                        Solana Age Verify is a <strong>full-stack privacy primitive</strong>, not a demo or single-use app.
                    </p>
                    <p style={{ marginBottom: '12px' }}>We chose the Open Track because this project is not limited to payments, tooling, or a single vertical.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h4 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontSize: '14px' }}>Real Privacy</h4>
                            <p style={{ margin: 0, fontSize: '13px' }}>Zero-storage biometrics. No photos, video, or embeddings leave the browser.</p>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h4 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontSize: '14px' }}>Production-Grade</h4>
                            <p style={{ margin: 0, fontSize: '13px' }}>Deployed Anchor program with PDA registry. Fixed 0.0005 SOL protocol fee.</p>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h4 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontSize: '14px' }}>Composable</h4>
                            <p style={{ margin: 0, fontSize: '13px' }}>Any dApp can gate via PDA read. No vendor lock-in. Verify once, use everywhere.</p>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <h4 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontSize: '14px' }}>Public Good</h4>
                            <p style={{ margin: 0, fontSize: '13px' }}>Enables compliance verticals. Reduces invasive KYC. Standard for Solana.</p>
                        </div>
                    </div>
                    <p style={{ marginTop: '16px', fontStyle: 'italic', color: 'var(--text-main)' }}>
                        This is not a hackathon-only artifact; it is a network primitive designed to persist beyond the event.
                    </p>
                </div>

                {/* Bounty Section */}
                <div className="glass" style={{
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    background: 'rgba(59, 130, 246, 0.08)',
                    marginBottom: '32px'
                }}>
                    <h2 style={{ color: '#3b82f6', marginTop: 0, marginBottom: '16px', fontSize: '22px' }}>QuickNode Public Benefit Prize</h2>
                    <p style={{ color: 'var(--text-main)', marginBottom: '16px' }}>
                        Age verification is a <strong>public good problem</strong>:
                    </p>
                    <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                        <li>Platforms need it</li>
                        <li>Users fear it</li>
                        <li>No one wants to host the data</li>
                    </ul>
                    <p style={{ marginBottom: '12px' }}>
                        <strong style={{ color: 'var(--text-main)' }}>SAS + QuickNode:</strong> Removes centralized storage, reduces compliance burden, improves online safety without surveillance.
                    </p>
                    <p style={{ marginBottom: '12px' }}>
                        Uses QuickNode for reliable transaction broadcasting, dynamic priority fees, and scalable verification reads.
                    </p>
                    <p style={{ fontStyle: 'italic', color: 'var(--text-main)', marginBottom: '0' }}>
                        The architecture assumes RPCs can fail—and designs for resilience. That&apos;s the difference between demos and infrastructure.
                    </p>
                </div>

                {/* Technical Detail */}
                <h2 style={{ color: 'var(--text-main)', marginTop: '40px' }}>Technical Architecture</h2>
                <p style={{ marginBottom: '24px' }}>Solana Age Verify uses a <strong>hybrid, privacy-first verification model</strong>:</p>

                <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
                    <div className="glass" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 8px 0' }}>1. Client-Side Verification</h4>
                        <p style={{ margin: 0, fontSize: '14px' }}>Face detection, age estimation, and liveness challenges run entirely in-browser. Active (gesture-based) + passive (surface analysis) anti-spoofing. No biometric data ever transmitted.</p>
                    </div>
                    <div className="glass" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 8px 0' }}>2. Deterministic Face Hash</h4>
                        <p style={{ margin: 0, fontSize: '14px' }}>Geometric facial landmarks → 128-D embedding → SHA-256 hash. Wallet-bound, salted, non-reversible. Used for Sybil resistance and verification reuse.</p>
                    </div>
                    <div className="glass" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 8px 0' }}>3. On-Chain Registry (Anchor)</h4>
                        <p style={{ margin: 0, fontSize: '14px' }}>PDA derived from user wallet. Stores: over18, facehash, userCode, timestamps, expiration. Adults valid 180 days; minors 90 days.</p>
                    </div>
                    <div className="glass" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 8px 0' }}>4. Oracle + SAS Issuance</h4>
                        <p style={{ margin: 0, fontSize: '14px' }}>Oracle observes chain events and issues Solana Attestation Service credentials post-verification. Oracle never exposes signing keys to clients.</p>
                    </div>
                </div>

                {/* Sponsor Integrations */}
                <h2 style={{ color: 'var(--text-main)', marginTop: '40px' }}>Sponsor Integrations</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(234, 88, 12, 0.3)', background: 'rgba(234, 88, 12, 0.05)' }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#ea580c', fontSize: '18px' }}>Helius</h3>
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                            <strong>High-performance reads:</strong> PDA reads, program state verification, Oracle monitoring. Low-latency for gating checks.
                        </p>
                    </div>
                    <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.05)' }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#3b82f6', fontSize: '18px' }}>QuickNode</h3>
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                            <strong>Transaction reliability:</strong> Submission, priority fees, failover pairing via SDK RpcManager. Ensures success under network stress.
                        </p>
                    </div>
                    <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '18px' }}>SAS Oracle</h3>
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                            <strong>Attestation:</strong> Issues SAS credentials after on-chain verification for portable, verifiable age status across dApps.
                        </p>
                    </div>
                    <div className="glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(147, 51, 234, 0.2)', background: 'rgba(147, 51, 234, 0.05)' }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#a855f7', fontSize: '18px' }}>Light Protocol</h3>
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                            <strong>Roadmap:</strong> ZK Compression for reduced rent and selective disclosure. Not in V1 (auditability first), planned for scale.
                        </p>
                    </div>
                </div>

                {/* Deep Dive Resources */}
                <h2 style={{ color: 'var(--text-main)', marginTop: '40px' }}>Deep Dive Resources</h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '16px' }}>Technical documentation in the OSS repo:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                    <a
                        href={`${import.meta.env.VITE_OSS_REPO_URL || 'https://github.com/TrenchChef/solana-age-verify-sdk'}/blob/main/docs/HOW_AGE_VERIFICATION_WORKS.md`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass"
                        style={{ padding: '16px', borderRadius: '12px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 6px 0', fontSize: '14px' }}>How Verification Works ↗</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>Geometric analysis and age estimation logic.</p>
                    </a>
                    <a
                        href={`${import.meta.env.VITE_OSS_REPO_URL || 'https://github.com/TrenchChef/solana-age-verify-sdk'}/blob/main/docs/specs/LIVENESS_DETECTION.md`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass"
                        style={{ padding: '16px', borderRadius: '12px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 6px 0', fontSize: '14px' }}>Liveness & Security ↗</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>Anti-spoofing measures and challenges.</p>
                    </a>
                    <a
                        href={`${import.meta.env.VITE_OSS_REPO_URL || 'https://github.com/TrenchChef/solana-age-verify-sdk'}/blob/main/docs/API_REFERENCE.md`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass"
                        style={{ padding: '16px', borderRadius: '12px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 6px 0', fontSize: '14px' }}>API Reference ↗</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>SDK methods, types, and configuration.</p>
                    </a>
                </div>

                {/* Roadmap */}
                <h2 style={{ color: 'var(--text-main)', marginTop: '40px' }}>Roadmap & Use of Awards</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px', marginBottom: '24px' }}>
                    <div className="glass" style={{ padding: '20px', borderRadius: '14px', borderLeft: '4px solid var(--success)' }}>
                        <h4 style={{ color: 'var(--success)', margin: '0 0 8px 0', fontSize: '15px' }}>Short Term</h4>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '1.6' }}>
                            <li>Mainnet hardening</li>
                            <li>Verified builds</li>
                            <li>Wallet-level SAS credentials</li>
                            <li>Reference integrations</li>
                        </ul>
                    </div>
                    <div className="glass" style={{ padding: '20px', borderRadius: '14px', borderLeft: '4px solid var(--primary)' }}>
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 8px 0', fontSize: '15px' }}>Mid Term</h4>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '1.6' }}>
                            <li>Registry network effects</li>
                            <li>Fee subsidies for adoption</li>
                            <li>Multisig governance</li>
                        </ul>
                    </div>
                    <div className="glass" style={{ padding: '20px', borderRadius: '14px', borderLeft: '4px solid rgba(255,255,255,0.3)' }}>
                        <h4 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontSize: '15px' }}>Long Term</h4>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '1.6' }}>
                            <li>Decentralized oracle</li>
                            <li>ZK compression via Light</li>
                            <li>Standard Solana primitive</li>
                        </ul>
                    </div>
                </div>

                <p style={{ fontStyle: 'italic', color: 'var(--text-main)' }}>
                    <strong>Hackathon prizes directly fund:</strong> Security audits, compression research, and ecosystem integrations.
                </p>

                {/* Hackathon Judge Guide */}
                <div className="glass" style={{
                    padding: '28px 32px',
                    borderRadius: '20px',
                    border: '2px solid #ffb300',
                    background: 'rgba(255, 179, 0, 0.08)',
                    marginTop: '48px',
                    marginBottom: '32px'
                }}>
                    <h2 style={{ color: '#ffb300', marginTop: 0, marginBottom: '20px', fontSize: '24px' }}>Hackathon Judge Guide</h2>
                    <p style={{ color: 'var(--text-main)', marginBottom: '16px', fontWeight: 600 }}>How to use the webapp</p>
                    <ol style={{ paddingLeft: '22px', marginBottom: '20px', color: 'var(--text-dim)', lineHeight: 1.7 }}>
                        <li><strong style={{ color: 'var(--text-main)' }}>Connect wallet</strong> — Click &quot;Connect Wallet to Verify&quot; and connect Phantom, Solflare, Trust, or WalletConnect (mobile).</li>
                        <li><strong style={{ color: 'var(--text-main)' }}>Check balance</strong> — You need at least ~0.003 SOL (protocol + app fee + gas). The page shows your current balance.</li>
                        <li><strong style={{ color: 'var(--text-main)' }}>Start verification</strong> — Click &quot;Start Verification&quot;, allow camera access, then follow the on-screen prompts (turn head, nod/shake). The check runs in your browser.</li>
                        <li><strong style={{ color: 'var(--text-main)' }}>Result</strong> — On success you&apos;ll see a User Code and a link to the on-chain transaction. If the wallet is already verified, you&apos;ll see &quot;Already Verified&quot; and the button is disabled.</li>
                    </ol>
                    <p style={{ color: 'var(--text-main)', marginBottom: '12px', fontWeight: 600 }}>Testing with new wallets</p>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '16px', lineHeight: 1.6 }}>
                        To test the full flow again, create a new wallet in your extension (Phantom/Solflare: add or create new wallet) or use a different device/browser. Connect that wallet on the webapp to run a fresh verification.
                    </p>
                    <p style={{ color: 'var(--text-main)', marginBottom: '8px', fontWeight: 600 }}>Need SOL?</p>
                    <p style={{ color: 'var(--text-dim)', marginBottom: 0, lineHeight: 1.6 }}>
                        We can airdrop SOL so you can run verification. Send requests to <a href="mailto:info@ageverify.live" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>info@ageverify.live</a> with your Solana address and whether you need Mainnet or Devnet SOL.
                    </p>
                </div>

                {/* Tech Stack */}
                <div style={{ marginTop: '48px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '32px' }}>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '16px' }}>Tech Stack</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {['Solana (Anchor)', 'TensorFlow.js', 'ONNX Runtime', 'SAS Oracle', 'Helius', 'QuickNode', 'Vercel Serverless', 'React + Vite'].map(tech => (
                            <span key={tech} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)' }}>{tech}</span>
                        ))}
                    </div>
                </div>

                {/* Contact */}
                <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontWeight: '600' }}>Contact</p>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                        Telegram: <a href="https://t.me/TalkChainLive" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>@TalkChainLive</a>
                        {' '} · {' '}
                        X: <a href="https://x.com/AVSolana" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>@AVSolana</a>
                    </p>
                </div>

                <div style={{ marginTop: '60px' }}>
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
