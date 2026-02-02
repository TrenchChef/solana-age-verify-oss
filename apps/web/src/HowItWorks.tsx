import { Header } from './App';

export default function HowItWorks({ onBack }: { onBack: () => void }) {
    const steps = [
        {
            title: "Connect Wallet",
            description: "Link your Solana wallet. We use only your public address—no personal details.",
            icon: (
                <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="12" width="26" height="20" rx="6" />
                    <circle cx="16" cy="22" r="3" />
                    <path d="M19 22h9" />
                    <path d="M32 22h10" />
                    <path d="M38 16v12" />
                </svg>
            )
        },
        {
            title: "Run Check",
            description: "Allow camera access, then follow the on-screen prompts. You’ll turn your head or nod when asked. The check runs entirely on your device and takes about 30 seconds.",
            icon: (
                <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="24" cy="20" r="14" />
                    <path d="M24 6v8" />
                    <path d="M12 16l7 4" />
                    <path d="M36 16l-7 4" />
                    <path d="M11 32c4-5 7 5 11 0s7-5 11 0 7 5 11 0" />
                </svg>
            )
        },
        {
            title: "Receive Proof",
            description: "Once you pass, a secure proof is recorded and tied to your wallet. You can use it across participating apps—verify once, use everywhere until it expires.",
            icon: (
                <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="8" y="10" width="26" height="20" rx="6" />
                    <path d="M14 16h10" />
                    <path d="M14 22h16" />
                    <path d="M34 20l6 0" />
                    <circle cx="40" cy="20" r="3" />
                    <circle cx="44" cy="20" r="1.5" />
                </svg>
            )
        }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            paddingTop: '120px',
            paddingBottom: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'radial-gradient(1200px 600px at 20% 10%, rgba(29, 233, 182, 0.12), transparent 60%), radial-gradient(900px 500px at 90% 20%, rgba(147, 51, 234, 0.12), transparent 60%), radial-gradient(700px 500px at 70% 90%, rgba(236, 72, 153, 0.12), transparent 60%), #05070f'
        }}>
            <Header onHome={onBack} />

            <div className="animate-fade-in how-it-works-root" style={{
                width: '100%',
                maxWidth: '1600px',
                minHeight: '900px',
                padding: '40px 56px 72px',
                borderRadius: '40px',
                position: 'relative'
            }}>
                <style>{`
                    .how-it-works-root {
                        background: transparent;
                        border: none;
                        box-shadow: none;
                    }
                    .how-it-works-grid {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 32px;
                        position: relative;
                        z-index: 1;
                    }
                    .how-it-works-cards {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(240px, 1fr));
                        gap: 24px;
                        padding: 0 12px;
                        max-width: 1000px;
                    }
                    .how-it-works-card {
                        position: relative;
                        padding: 32px 28px 30px;
                        border-radius: 28px;
                        background: rgba(10, 14, 26, 0.9);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02), 0 20px 50px rgba(4, 6, 14, 0.8);
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        min-height: 220px;
                    }
                    .how-it-works-icon {
                        width: 64px;
                        height: 64px;
                        border-radius: 20px;
                        background: linear-gradient(135deg, rgba(20, 241, 149, 0.12), rgba(124, 58, 237, 0.15));
                        color: #e5f7ff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 0 24px rgba(20, 241, 149, 0.15);
                    }
                    @media (max-width: 1200px) {
                        .how-it-works-cards {
                            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                        }
                    }
                    @media (max-width: 980px) {
                        .how-it-works-root {
                            padding: 32px 28px 64px;
                        }
                    }
                `}</style>
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <h1 className="gradient-text hiw-hero-title">Privacy-first age verification on Solana: Verify once. Prove it anywhere.</h1>
                    <p style={{ fontSize: '18px', color: 'var(--text-dim)', marginBottom: '64px', maxWidth: '700px', margin: '0 auto 64px auto' }}>
                        A secure way to prove you’re an adult without sharing IDs or biometric data.
                    </p>
                </div>

                <div className="how-it-works-grid">
                    <div className="how-it-works-cards">
                        {steps.map((step) => (
                            <div key={step.title} className="how-it-works-card">
                                <div className="how-it-works-icon">{step.icon}</div>
                                <h3 style={{ fontSize: '22px', color: '#f8fafc', margin: 0 }}>{step.title}</h3>
                                <p style={{ color: 'rgba(255, 255, 255, 0.68)', lineHeight: '1.5', margin: 0, fontSize: '15px' }}>
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <section className="hiw-guide-process">
                    <h2 className="hiw-guide-section-title">What happens when you verify</h2>
                    <p className="hiw-guide-section-intro">
                        The full flow takes about 30 seconds. Here’s what you’ll do:
                    </p>
                    <ol className="hiw-guide-steps">
                        <li><strong>Camera access</strong> — You’ll be asked to allow your camera. It’s used only to see your face during the check; nothing is recorded or sent elsewhere.</li>
                        <li><strong>Follow the prompts</strong> — The app will ask you to perform simple actions to prove you’re a real person: turn your head (left, right, up, or down) or do a clear nod or shake. Do each one when prompted.</li>
                        <li><strong>Instant check</strong> — Our system quickly analyzes your face on your device to confirm you’re present and to estimate age. All of this stays on your phone or computer.</li>
                        <li><strong>Done</strong> — If you pass, a secure proof is saved and linked to your wallet. You’re verified and can use it across partner apps.</li>
                    </ol>
                </section>

                <section className="hiw-explainer">
                    <div className="hiw-explainer-block">
                        <h3 className="hiw-explainer-heading">Biometrics</h3>
                        <p className="hiw-explainer-text">
                            We use your face only to confirm you’re a real person and that you meet the age requirement.
                            We don’t keep photos, videos, or any image of you.
                        </p>
                    </div>
                    <div className="hiw-explainer-block">
                        <h3 className="hiw-explainer-heading">Private proof</h3>
                        <p className="hiw-explainer-text">
                            We never save your face or personal details. Only a secure, anonymous proof that you’re an adult is recorded.
                            Apps can check that proof without learning who you are.
                        </p>
                    </div>
                    <div className="hiw-explainer-block">
                        <h3 className="hiw-explainer-heading">Privacy-first collection</h3>
                        <p className="hiw-explainer-text">
                            Everything runs on your device. Your camera feed and face data never leave your phone or computer.
                            We can’t see or store what you look like.
                        </p>
                    </div>
                    <div className="hiw-explainer-block">
                        <h3 className="hiw-explainer-heading">Cost and how long it lasts</h3>
                        <p className="hiw-explainer-text">
                            A small fee (about a few cents in crypto) is required to record your verification. Adults stay verified for about 3 months;
                            if you’re under 18, verification lasts about 1 month, since faces change more quickly at younger ages.
                        </p>
                    </div>
                </section>

                <section className="hiw-guide-tips">
                    <h2 className="hiw-guide-section-title">Tips for success</h2>
                    <ul className="hiw-guide-tips-list">
                        <li><strong>Lighting</strong> — Use a well-lit room with the light in front of you. Avoid strong backlight or a dark background.</li>
                        <li><strong>Position</strong> — Keep your face inside the oval guide on the screen. Face the camera directly.</li>
                        <li><strong>Pace</strong> — Move slowly and wait for the confirmation beep before moving to the next step.</li>
                    </ul>
                </section>

                <section className="hiw-guide-troubleshoot">
                    <h2 className="hiw-guide-section-title">If it doesn’t work</h2>
                    <p className="hiw-guide-troubleshoot-intro">
                        Verification may fail if lighting is poor, your face is partly covered (e.g. glasses, hat, or hands),
                        or the prompts aren’t followed. Check camera permissions, improve lighting, center your face, and try again.
                    </p>
                </section>

                <section className="hiw-artifact" style={{ marginTop: '56px' }}>
                    <div className="hiw-artifact-grid">
                        <h2 className="hiw-artifact-title">About our Verification</h2>
                        <div className="hiw-artifact-banners">
                            <div className="hiw-feature">
                                <div className="hiw-feature-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <circle cx="6" cy="12" r="2.4" />
                                        <circle cx="18" cy="6" r="2.4" />
                                        <circle cx="18" cy="18" r="2.4" />
                                        <path d="M8.1 11l7.2-4.2M8.1 13l7.2 4.2" />
                                    </svg>
                                </div>
                                <div className="hiw-feature-body">
                                    <div className="hiw-feature-label">
                                        <span>18+ Attestation</span>
                                    </div>
                                    <p className="hiw-feature-text">
                                        A simple on-chain flag confirming adulthood (no personal details).
                                    </p>
                                </div>
                            </div>
                            <div className="hiw-feature">
                                <div className="hiw-feature-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <path d="M4 8h6m-6 8h6" />
                                        <path d="M20 6v12m0 0-4-4m4 4-4 4" />
                                        <rect x="10" y="6" width="6" height="12" rx="2" />
                                    </svg>
                                </div>
                                <div className="hiw-feature-body">
                                    <div className="hiw-feature-label">
                                        <span>Session Commitment + User Code</span>
                                    </div>
                                    <p className="hiw-feature-text">
                                        Discourages sharing without storing biometrics.
                                    </p>
                                </div>
                            </div>
                            <div className="hiw-feature">
                                <div className="hiw-feature-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <circle cx="12" cy="12" r="7" />
                                        <path d="M12 8v4l3 2" />
                                    </svg>
                                </div>
                                <div className="hiw-feature-body">
                                    <div className="hiw-feature-label">
                                        <span>Expiry</span>
                                    </div>
                                    <p className="hiw-feature-text">
                                        Adults: 90 days. Under-18: 30 days.
                                    </p>
                                </div>
                            </div>
                            <div className="hiw-feature">
                                <div className="hiw-feature-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <rect x="4" y="4" width="16" height="16" rx="3" />
                                        <path d="M8 8h8M8 12h8M8 16h5" />
                                    </svg>
                                </div>
                                <div className="hiw-feature-body">
                                    <div className="hiw-feature-label">
                                        <span>Issuer Signature</span>
                                    </div>
                                    <p className="hiw-feature-text">
                                        Oracle-signed for third-party verification.
                                    </p>
                                </div>
                            </div>
                            <div className="hiw-feature">
                                <div className="hiw-feature-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <path d="M5 7h14M5 12h14M5 17h14" />
                                        <path d="M9 7v10M15 7v10" />
                                    </svg>
                                </div>
                                <div className="hiw-feature-body">
                                    <div className="hiw-feature-label">
                                        <span>One-Call Verifiable (PDA Record)</span>
                                    </div>
                                    <p className="hiw-feature-text">
                                        Single-call verification with a minimal on-chain record.
                                    </p>
                                </div>
                            </div>
                            <div className="hiw-feature">
                                <div className="hiw-feature-icon">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <circle cx="6" cy="12" r="2.2" />
                                        <circle cx="12" cy="6" r="2.2" />
                                        <circle cx="18" cy="12" r="2.2" />
                                        <circle cx="12" cy="18" r="2.2" />
                                        <path d="M7.7 10.7l2.6-2.6M13.7 7.7l2.6 2.6M16.3 13.3l-2.6 2.6M10.3 16.3l-2.6-2.6" />
                                    </svg>
                                </div>
                                <div className="hiw-feature-body">
                                    <div className="hiw-feature-label">
                                        <span>Recognized Across Partners</span>
                                    </div>
                                    <p className="hiw-feature-text">
                                        Verify once, reuse across participating apps.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div style={{ marginTop: '64px' }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            padding: '16px 32px',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '16px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
