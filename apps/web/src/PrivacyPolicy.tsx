import { Header } from './App';

export default function PrivacyPolicy({ onBack }: { onBack: () => void }) {
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
                <h1 className="gradient-text" style={{ fontSize: '36px', marginBottom: '24px' }}>Privacy Policy</h1>
                <p style={{ color: 'var(--text-main)', fontWeight: '600' }}>Last Updated: January 29, 2026</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>1. Privacy-First Architecture</h2>
                <p>Your privacy is our top priority. Solana Age Verify is built using cutting-edge privacy-preserving technologies:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Zero-Knowledge Biometrics:</strong> All biometric analysis and age estimation occur entirely within your web browser using WebAssembly. No images, video feeds, or biometric templates are ever sent to our servers or stored by us.</li>
                    <li><strong>On-Chain Record:</strong> Verification data is stored on-chain as a standard PDA tied to your wallet, with SAS credentials issued by the Oracle.</li>
                    <li><strong>Cross-Platform Interoperability:</strong> Your on-chain verification status is recognized across our entire network of partners. Verify once, and use your status on any participating dApp without repeating the verification process.</li>
                    <li><strong>Local-Only Processing:</strong> AI models run completely in your browser. Your face data never leaves your device.</li>
                </ul>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>2. Data Minimization</h2>
                <p>We collect and store the absolute minimum data necessary for age verification:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li><strong>Face images:</strong> Never stored anywhere. Biometric embeddings exist only in your device&apos;s memory during the scan (~30 seconds) and are never transmitted.</li>
                    <li><strong>On-Chain Data:</strong> Only a cryptographic facehash (non-reversible), age verification status (boolean), wallet address, and verification timestamp</li>
                    <li><strong>User Codes:</strong> If you verify as an adult (18+), a 5-character alphanumeric code is generated (e.g., &quot;XP79K&quot;). This code contains no personal information and is only for convenient re-verification.</li>
                    <li><strong>Expiry Timestamps:</strong> Adult verifications expire after 90 days; under-18 verifications expire after 30 days (enforced by the protocol).</li>
                    <li><strong>No PII:</strong> We do not collect names, email addresses, phone numbers, government IDs, or any personally identifiable information</li>
                </ul>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>3. Blockchain Transparency</h2>
                <p>Verification results are stored on the public Solana blockchain in a PDA record associated with your wallet address. The data includes:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li>Facehash (cryptographic hash, not reversible to original biometric data)</li>
                    <li>Age verification status (over/under 18)</li>
                    <li>User code (if adult, 5 random characters)</li>
                    <li>Verification and expiry timestamps</li>
                </ul>
                <p style={{ marginTop: '12px' }}>This data is publicly visible on the blockchain but contains no personal or biometric information that could identify you.</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>4. Third-Party Services</h2>
                <p>We connect to the Solana network via RPC nodes. These nodes may see your IP address and wallet address during transaction submission, consistent with standard blockchain usage. Our Oracle may log IP addresses for security; such logs are retained for up to 7 days and then rotated.</p>

                <h2 style={{ color: 'var(--text-main)', marginTop: '32px' }}>5. Data Security</h2>
                <p>Multiple layers of security protect your privacy:</p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                    <li>One-way cryptographic hashing prevents reconstruction of facial data</li>
                    <li>Cryptographic signatures validate data without exposing sensitive information</li>
                    <li>No centralized database storing biometric information</li>
                    <li>Open-source code available for public audit</li>
                </ul>

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
