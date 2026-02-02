import { Header } from './App';

export default function TermsOfService({ onBack }: { onBack: () => void }) {
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
                <h1 className="gradient-text" style={{ fontSize: '36px', marginBottom: '24px' }}>Terms of Service</h1>
                <p style={{ color: 'var(--text-main)', fontWeight: '600' }}>Last Updated: January 29, 2026</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>1. Acceptance of Terms</h2>
                <p>By using the Solana Age Verify service, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>2. Description of Service</h2>
                <p>Solana Age Verify provides a decentralized, privacy-preserving age verification service on the Solana blockchain. Our service uses in-browser biometric inference to estimate age without storing personal data.</p>
                <p style={{ marginTop: '12px' }}>Key features include:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li>Local biometric processing (zero data transmission)</li>
                    <li>On-chain PDA record linked to your wallet</li>
                    <li>5-character user codes for verified adults</li>
                    <li>SAS (Solana Attestation Service) credentials</li>
                </ul>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>3. Fees and Costs</h2>
                <p><strong>Protocol Fee:</strong> The base protocol fee is fixed at <strong>0.0005 SOL</strong> per verification. This fee covers on-chain recording and PDA creation costs.</p>
                <p style={{ marginTop: '12px' }}><strong>Application Fee:</strong> This demo application charges an additional service fee of <strong>0.001 SOL</strong> per verification. Together with the protocol fee and network (gas) costs, the total is approximately <strong>0.003 SOL</strong> per verification.</p>
                <p style={{ marginTop: '12px' }}><strong>Fee updates:</strong> The protocol fee is fixed in the protocol. App fee and total cost may vary by integrator; this demo reflects current amounts.</p>
                <p style={{ marginTop: '12px' }}><strong>Important:</strong> All fees are non-refundable, regardless of verification outcome (success or failure).</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>4. Verification Expiry</h2>
                <p>Age verification credentials have expiration periods:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Adults (18+):</strong> Credentials expire after 90 days and must be renewed</li>
                    <li><strong>Under 18:</strong> Credentials expire after 30 days</li>
                </ul>
                <p style={{ marginTop: '12px' }}>You will need to re-verify after your credential expires to maintain access to age-gated services.</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>5. User Codes</h2>
                <p>Upon successful adult verification, you will receive a unique 5-character alphanumeric user code (e.g., "XP79K"). This code is permanently tied to your wallet address and facehash. User codes are NOT generated for under-18 verifications.</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>6. Disclaimer of Warranty</h2>
                <p>The service is provided "as is" without any warranties. Age estimation is probabilistic and may have errors. We do not guarantee the accuracy of any verification.</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>7. Limitation of Liability</h2>
                <p>Solana Age Verify shall not be liable for any damages arising out of the use or inability to use the service, including but not limited to failed verifications, expired credentials, or integration issues.</p>

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
