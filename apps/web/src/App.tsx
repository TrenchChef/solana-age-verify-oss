import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { verifyHost18Plus, VerifyResult, checkExistingVerification, VerificationCredential, SDK_VERSION } from 'solana-age-verify';
import { Connection, LAMPORTS_PER_SOL, SendTransactionError, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useWallet, useConnection, ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TrustWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';
import { Analytics } from "@vercel/analytics/react";
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import Help from './Help';
import Wiki from './Wiki';
import HowItWorks from './HowItWorks';
import Hackathon from './Hackathon';
import Spinner from './Spinner';
import {
    PROTOCOL_FEE_SOL,
    APP_FEE_SOL,
    TOTAL_FEE_SOL,
    RECOMMENDED_BALANCE_SOL
} from './constants/fees';


// CSS for Wallet Adapter
import '@solana/wallet-adapter-react-ui/styles.css';

import AgeWorker from '../../../packages/age-verify-sdk/src/worker/worker.ts?worker';
import * as ort from 'onnxruntime-web';

// Suppress ONNX warnings
ort.env.logLevel = 'error';


// --- Components ---

const WalletMenuButton = () => {
    const { connected, connecting, publicKey, wallet, disconnect, select } = useWallet();
    const { setVisible: setWalletModalVisible } = useWalletModal();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const shortAddress = publicKey ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}` : '';
    const hasWalletSelected = !!wallet;

    const buttonLabel = connecting
        ? 'Connecting...'
        : connected
            ? `${wallet?.adapter?.name || 'Wallet'} • ${shortAddress}`
            : hasWalletSelected
                ? `${wallet?.adapter?.name || 'Wallet'}`
                : 'Connect Wallet';

    const handlePrimaryClick = () => {
        if (!hasWalletSelected) {
            setWalletModalVisible(true);
            return;
        }
        setIsOpen((prev) => !prev);
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
        } finally {
            select(null);
            setIsOpen(false);
        }
    };

    const handleConnect = () => {
        setWalletModalVisible(true);
        setIsOpen(false);
    };

    const handleChangeWallet = async () => {
        if (connected) {
            try {
                await disconnect();
            } catch {
                // Ignore disconnect errors; still allow reselect.
            }
        }
        select(null);
        setWalletModalVisible(true);
        setIsOpen(false);
    };

    return (
        <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
                className="wallet-adapter-button"
                onClick={handlePrimaryClick}
                disabled={connecting}
                style={{ gap: '8px' }}
            >
                <span>{buttonLabel}</span>
                {hasWalletSelected && (
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>{isOpen ? '▲' : '▼'}</span>
                )}
            </button>
            {isOpen && hasWalletSelected && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '8px',
                        minWidth: '180px',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
                        zIndex: 200
                    }}
                >
                    {!connected && (
                        <button
                            onClick={handleConnect}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-main)',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            Connect
                        </button>
                    )}
                    <button
                        onClick={handleChangeWallet}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-main)',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            textAlign: 'left',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        Change wallet
                    </button>
                    <button
                        onClick={handleDisconnect}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: '#ff6b6b',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            textAlign: 'left',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
};

export const Header = ({
    onHome,
    onSdkClick,
    selectedNetwork = 'devnet',
    onNetworkChange
}: {
    onHome?: () => void;
    onSdkClick?: () => void;
    selectedNetwork?: 'devnet' | 'mainnet-beta';
    onNetworkChange?: (network: 'devnet' | 'mainnet-beta') => void;
}) => (
    <>
        <nav style={{
            width: '100%',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'fixed',
            top: 0,
            zIndex: 100,
            background: 'rgba(2, 6, 23, 0.4)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => onHome ? onHome() : window.location.href = '/'}>
                <img src="/images/logo.png" alt="Solana Age Verify" style={{ width: '56px', height: '56px', borderRadius: '12px' }} />
                <h1 className="gradient-text" style={{ margin: 0, fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', letterSpacing: '-0.02em' }}>
                    Age Verify
                </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                    className="hidden-mobile"
                    onClick={() => onSdkClick ? onSdkClick() : null}
                    style={{
                        height: '48px',
                        padding: '0 22px',
                        borderRadius: '8px',
                        background: '#14F195',
                        color: '#0b1220',
                        border: 'none',
                        fontSize: '15px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 20px -10px rgba(20, 241, 149, 0.6)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 14px 24px -12px rgba(20, 241, 149, 0.7)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 20px -10px rgba(20, 241, 149, 0.6)';
                    }}
                >
                    Get the SDK
                </button>
                {/* Network toggle: Devnet | Mainnet */}
                {onNetworkChange && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>Network:</span>
                        <select
                            value={selectedNetwork}
                            onChange={(e) => {
                                const next = e.target.value as 'devnet' | 'mainnet-beta';
                                onNetworkChange(next);
                            }}
                            style={{
                                height: '36px',
                                padding: '0 10px',
                                borderRadius: '8px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-main)',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="devnet">Devnet</option>
                            <option value="mainnet-beta">Mainnet</option>
                        </select>
                    </div>
                )}
                <WalletMenuButton />
            </div>
        </nav>
    </>
);

interface LoggerProps {
    logs: string[];
    isVisible: boolean;
    onToggle: () => void;
    disableAutoScroll?: boolean;
}

const Logger = ({ logs, isVisible, onToggle, disableAutoScroll }: LoggerProps) => {
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (disableAutoScroll || !logEndRef.current) return;
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [logs, disableAutoScroll]);

    return (
        <div style={{
            position: 'fixed',
            right: isVisible ? '24px' : '-400px',
            bottom: '24px',
            width: '350px',
            height: '400px',
            zIndex: 1000,
            transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }} className="glass glass-shadow">
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '0.05em' }}>SYSTEM LOGS</span>
                </div>
                <button
                    onClick={onToggle}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
                >
                    ×
                </button>
            </div>
            <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                lineHeight: '1.6'
            }}>
                {logs.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
                        Waiting for activity...
                    </div>
                )}
                {logs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '8px', color: log.includes('Error') ? 'var(--error)' : 'var(--text-dim)', display: 'flex', gap: '8px' }}>
                        <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>{'>'}</span>
                        <span>{log}</span>
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};

// --- DEBUG PANEL ---
interface DebugPanelProps {
    connected: boolean;
    publicKey: { toBase58(): string } | null;
    network: string;
    endpoint: string;
    wallets: { adapter: { name: string }; readyState: string }[];
}
const DebugPanel = ({ connected, publicKey, network, endpoint, wallets }: DebugPanelProps) => (
    <div style={{
        position: 'fixed',
        left: '20px',
        bottom: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#0f0',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '10px',
        fontFamily: 'monospace',
        zIndex: 9999,
        pointerEvents: 'none',
        border: '1px solid #333'
    }}>
        <div><strong>STATUS:</strong> {connected ? 'CONNECTED' : 'DISCONNECTED'}</div>
        <div><strong>PUBKEY:</strong> {publicKey?.toBase58() || 'null'}</div>
        <div><strong>NETWORK:</strong> {network}</div>
        <div><strong>RPC:</strong> {endpoint}</div>
        <div><strong>WALLETS FOUND:</strong> {wallets.length}</div>
        {wallets.map((w: { adapter: { name: string }; readyState: string }) => (
            <div key={w.adapter.name}>- {w.adapter.name} ({w.readyState})</div>
        ))}
    </div>
);

// --- Main Verification Content ---

interface VerificationContentProps {
    statusConnection: Connection | null;
    statusEndpoint?: string;
    selectedNetwork: 'devnet' | 'mainnet-beta';
    setSelectedNetwork: (n: 'devnet' | 'mainnet-beta') => void;
}

function VerificationContent({ statusConnection, statusEndpoint, selectedNetwork, setSelectedNetwork }: VerificationContentProps) {
    const [verifying, setVerifying] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [error, setError] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);
    const [showLogger, setShowLogger] = useState(false);
    const [page, setPage] = useState<'home' | 'tos' | 'privacy' | 'help' | 'wiki' | 'how-it-works' | 'hackathon'>('home');
    const [isVerifiedSession, setIsVerifiedSession] = useState(false);
    const [existingVerification, setExistingVerification] = useState<VerificationCredential | null>(null);
    const [showConnectModal, setShowConnectModal] = useState(false);

    useEffect(() => {
        // We no longer rely on localStorage for verification status.
        // The on-chain check will handle this in the next effect.
    }, []);

    const { publicKey, signTransaction, connected, connecting, wallet, disconnect, select } = useWallet();
    const { connection } = useConnection();
    const { setVisible: setWalletModalVisible } = useWalletModal();

    const handleNetworkChange = (next: 'devnet' | 'mainnet-beta') => {
        if (next === selectedNetwork) return;
        disconnect().then(() => select(null)).catch(() => select(null));
        setSelectedNetwork(next);
    };

    // Check verification status on connect (use Helius-backed connection to avoid QuickNode rate limits)
    const connectionForStatus = statusConnection ?? connection;
    useEffect(() => {
        if (connected && publicKey && connectionForStatus) {
            if (statusEndpoint) {
                console.log('[App] Status RPC endpoint:', statusEndpoint);
            }
            console.log('[App] Checking on-chain verification status...');
            checkExistingVerification(connectionForStatus, publicKey)
                .then(record => {
                    const now = Math.floor(Date.now() / 1000);
                    const isActive = !!record && record.expiration > now && record.over18;
                    console.log('[App] Verification PDA Record:', record);
                    setIsVerifiedSession(isActive);
                    setExistingVerification(isActive ? record : null);
                })
                .catch(err => {
                    console.error('[App] Failed to check status:', err);
                    setIsVerifiedSession(false);
                    setExistingVerification(null);
                });
        } else {
            setIsVerifiedSession(false);
            setExistingVerification(null);
        }
    }, [connected, publicKey, connectionForStatus, statusEndpoint]);

    // Prevent any autoscroll after verification completes (preserve viewport position)
    const prevResultRef = useRef<VerifyResult | null>(null);
    useEffect(() => {
        if (result == null) {
            prevResultRef.current = null;
            return;
        }
        const justCompleted = prevResultRef.current === null;
        prevResultRef.current = result;
        if (!justCompleted) return;
        const x = window.scrollX;
        const y = window.scrollY;
        const restore = () => window.scrollTo(x, y);
        requestAnimationFrame(restore);
        const t = setTimeout(restore, 0);
        return () => clearTimeout(t);
    }, [result]);

    // Debug wallet state
    useEffect(() => {
        console.log('[Wallet Debug]', { connected, connecting, wallet: wallet?.adapter?.name, publicKey: publicKey?.toBase58() });

        const handleWalletError = (e: Event) => {
            setLogs(prev => [...prev, `❌ Wallet Error: ${(e as CustomEvent).detail}`]);
            // Only show logger automatically if NOT on production (allow Vercel/Local)
            if (typeof window !== 'undefined') {
                const hostname = window.location.hostname;
                if (hostname === 'localhost' || hostname.endsWith('.vercel.app')) {
                    setShowLogger(true);
                }
            }
        };
        window.addEventListener('sav-wallet-error', handleWalletError);
        return () => window.removeEventListener('sav-wallet-error', handleWalletError);
    }, [connected, connecting, wallet, publicKey]);

    const [showFirstUserMessage, setShowFirstUserMessage] = useState(false);
    const [showInitialLoading, setShowInitialLoading] = useState(false);
    const [canContinue, setCanContinue] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const verifiedUntil = existingVerification
        ? new Date(existingVerification.expiration * 1000).toLocaleDateString()
        : null;

    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const uiRef = useRef<HTMLDivElement>(null);
    const instructionRef = useRef<HTMLDivElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);

    // Callback ref to attach stream when video element mounts/changes
    const setVideoRef = (element: HTMLVideoElement | null) => {
        (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = element;
        if (element && cameraStreamRef.current) {
            if (element.srcObject !== cameraStreamRef.current) {
                console.log('[Camera] Attaching stream to video element');
                element.srcObject = cameraStreamRef.current;
            }
        }
    };

    // Start camera preview when wallet is connected
    useEffect(() => {
        if (connected && publicKey && !cameraStreamRef.current && !verifying) {
            console.log('[Camera] Starting preview...');
            navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                audio: false
            }).then(stream => {
                cameraStreamRef.current = stream;
                setCameraReady(true);

                // If video element is already mounted, attach stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    console.log('[Camera] Preview attached to video element');
                }
            }).catch(err => {
                console.error('[Camera] Failed to start preview:', err);
                setLogs(prev => [...prev, `⚠️ Camera access denied: ${err.message}`]);
            });
        }

        // Cleanup on disconnect
        return () => {
            if (!connected && cameraStreamRef.current) {
                console.log('[Camera] Stopping preview on disconnect');
                cameraStreamRef.current.getTracks().forEach(track => track.stop());
                cameraStreamRef.current = null;
                setCameraReady(false);
            }
        };
    }, [connected, publicKey, verifying]);

    // Re-attach camera stream when video element changes (e.g., switching between preview and verification views)
    useEffect(() => {
        if (videoRef.current && cameraStreamRef.current) {
            // Check if the stream is already attached to this video element
            if (videoRef.current.srcObject !== cameraStreamRef.current) {
                console.log('[Camera] Re-attaching stream to new video element');
                videoRef.current.srcObject = cameraStreamRef.current;
            }
        }
    }, [verifying, result]);

    const [balance, setBalance] = useState<number | null>(null);

    // Check balance when wallet connects
    useEffect(() => {
        if (connected && publicKey && connection) {
            connection.getBalance(publicKey).then(bal => {
                setBalance(bal / LAMPORTS_PER_SOL);
                console.log('[Wallet] Balance:', bal / LAMPORTS_PER_SOL, 'SOL');
            }).catch(err => {
                console.error('[Wallet] Failed to fetch balance:', err);
            });
        } else {
            setBalance(null);
        }
    }, [connected, publicKey, connection]);

    const startVerification = async () => {
        if (!publicKey || !signTransaction) {
            setError('Please connect your wallet first.');
            return;
        }

        // Final balance check before start
        try {
            const currentBalance = await connection.getBalance(publicKey);
            if (currentBalance < RECOMMENDED_BALANCE_SOL * LAMPORTS_PER_SOL) {
                setError(`Insufficient balance. You need at least ${RECOMMENDED_BALANCE_SOL.toFixed(4)} SOL (Found ${(currentBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL). Please request a Devnet Airdrop via your wallet.`);
                return;
            }
        } catch {
            console.warn('Could not verify balance, attempting anyway...');
        }

        if (verifying) return; // Prevent double click

        setVerifying(true);
        setLoadingModels(true);
        setResult(null);
        setError('');
        // setShowLogger(true); // Logs hidden by default
        setLogs(['🚀 Initializing verification protocol...']);
    };

    // Close modal when connected
    useEffect(() => {
        if (connected && publicKey) {
            setShowConnectModal(false);
        }
    }, [connected, publicKey]);

    // Actual SDK Trigger - runs when verifying state is true AND video element is ready
    // Note: The actual execution logic is handled in the separate useEffect below to avoid race conditions
    useEffect(() => {
        // This effect can be used for other side-effects if needed, 
        // but currently the main logic is in the isRunningProtocol effect
    }, [verifying]);

    // Ref to track if we are currently executing the async protocol to prevent dupes
    const isRunningProtocol = useRef(false);

    useEffect(() => {
        if (verifying && videoRef.current && !isRunningProtocol.current) {
            console.log('[App] Triggering SDK protocol...');
            isRunningProtocol.current = true;

            const execute = async () => {
                if (!publicKey) return;
                try {
                    setLogs(prev => [...prev, '📷 Starting camera...']);

                    const res = await verifyHost18Plus({
                        walletPubkeyBase58: publicKey.toBase58(),
                        videoElement: videoRef.current || undefined,
                        uiMountEl: uiRef.current || undefined,
                        instructionElement: instructionRef.current || undefined,
                        config: {
                            protocolFeeSol: PROTOCOL_FEE_SOL,
                            appFeeSol: APP_FEE_SOL
                        },
                        rpcUrls: (selectedNetwork === 'mainnet-beta'
                            ? [
                                (import.meta.env.VITE_HELIUS_MAIN_RPC_URL as string),
                                (import.meta.env.VITE_QUICKNODE_MAIN_RPC_URL as string),
                                (import.meta.env.VITE_HELIUS_RPC_URL as string),
                                (import.meta.env.VITE_QUICKNODE_RPC_URL as string)
                            ]
                            : [
                                (import.meta.env.VITE_RPC_URL as string),
                                (import.meta.env.VITE_HELIUS_RPC_URL as string),
                                (import.meta.env.VITE_QUICKNODE_RPC_URL as string),
                                (import.meta.env.helius_rpc_url as string),
                                (import.meta.env.quicknode_rpc_url as string),
                                (import.meta.env.HELIUS_RPC_URL as string),
                                (import.meta.env.QUICKNODE_RPC_URL as string)
                            ]
                        ).filter((url: string) => !!url && !url.includes('api.devnet.solana.com')),
                        appTreasury: import.meta.env.VITE_INTEGRATOR_ADDRESS || '4S5jR31w54VnkCjy3j8SzDGbkGgWoTTX7o7Sz87HYifK',
                        platformTreasury: import.meta.env.VITE_PLATFORM_PUBKEY || 'vrFYXf63CSksNdhCm183AnX6ogoLV53cT3eMU7TktXi',
                        onChallenge: (c: string) => {
                            setLogs(prev => [...prev, `🎯 Challenge: ${c}`]);
                        },
                        onInitialized: () => {
                            console.log("DEBUG: Using Platform Key:", import.meta.env.VITE_PLATFORM_PUBKEY || 'vrFYXf63CSksNdhCm183AnX6ogoLV53cT3eMU7TktXi');
                            setLoadingModels(false);
                            setLogs(prev => [...prev, '🟢 Models loaded, starting verification...']);
                        },
                        workerFactory: () => new AgeWorker(),
                        connection,
                        wallet: {
                            publicKey,
                            signTransaction: async (tx: Transaction | VersionedTransaction) => {
                                setLogs(prev => [...prev, `✍️ Awaiting wallet signature for fees (${TOTAL_FEE_SOL} SOL)...`]);
                                if (signTransaction) return await signTransaction(tx) as Transaction;
                                throw new Error("Wallet does not support signing");
                            }
                        } as { publicKey: typeof publicKey; signTransaction: (tx: Transaction) => Promise<Transaction> }
                    });

                    setResult(res);

                    // Detailed logging of results
                    const status = res.over18 ? '✅ PASSED' : '❌ FAILED';
                    setLogs(prev => [...prev, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`]);
                    setLogs(prev => [...prev, `${status} - Age Verification Complete`]);
                    setLogs(prev => [...prev, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`]);

                    if (res.evidence) {
                        const {
                            ageEstimate,
                            ageEstimateGeometric,
                            ageEstimateEnhanced,
                            ageConfidence,
                            livenessScore,
                            surfaceScore,
                            ageMethod,
                            challenges
                        } = res.evidence;
                        setLogs(prev => [...prev, `📊 Final Age Estimate: ${Math.round(ageEstimate || 0)} years`]);
                        if (ageEstimateEnhanced !== undefined) {
                            setLogs(prev => [...prev, `⚡ Enhanced Age: ${Math.round(ageEstimateEnhanced || 0)} years`]);
                        }
                        if (ageEstimateGeometric !== undefined) {
                            setLogs(prev => [...prev, `🧮 Geometric Age: ${Math.round(ageEstimateGeometric || 0)} years`]);
                        }
                        setLogs(prev => [...prev, `🎯 Age Confidence: ${((ageConfidence || 0) * 100).toFixed(1)}%`]);
                        setLogs(prev => [...prev, `👁️ Liveness Score: ${((livenessScore || 0) * 100).toFixed(1)}%`]);
                        if (surfaceScore !== undefined) {
                            setLogs(prev => [...prev, `🛡️ Surface Integrity: ${((surfaceScore || 0) * 100).toFixed(1)}%`]);
                        }
                        setLogs(prev => [...prev, `🔬 Diagnostic Method: ${ageMethod || 'unknown'}`]);

                        if (challenges && challenges.length > 0) {
                            setLogs(prev => [...prev, `🏆 Challenges:`]);
                            challenges.forEach((c: { type: string; passed: boolean }) => {
                                const icon = c.passed ? '✓' : '✗';
                                setLogs(prev => [...prev, `   ${icon} ${c.type}: ${c.passed ? 'PASS' : 'FAIL'}`]);
                            });
                        }
                    }

                    if (res.referralCode) {
                        setLogs(prev => [...prev, `🎫 Referral Code: ${res.referralCode}`]);
                    }

                    if (res.facehash) {
                        setLogs(prev => [...prev, `🔐 Face Hash: ${res.facehash.substring(0, 16)}...`]);
                    }

                    if (res.over18) {
                        setIsVerifiedSession(true);
                    }

                    if (res.protocolFeeTxId) {
                        setLogs(prev => [...prev, `⛓️ On-chain TX: ${res.protocolFeeTxId?.substring(0, 16)}...`]);

                        // Oracle Call (only if over18): verify tx succeeded, wait for indexer, then call oracle
                        if (res.over18) {
                            (async () => {
                                try {
                                    // Verify transaction succeeded on-chain before calling oracle
                                    const txStatus = await connection.getTransaction(res.protocolFeeTxId!, {
                                        commitment: 'confirmed',
                                        maxSupportedTransactionVersion: 0
                                    });
                                    if (txStatus?.meta?.err) {
                                        setLogs(prev => [...prev, '❌ Transaction failed on-chain; skipping SAS credential.']);
                                        return;
                                    }
                                    // Allow 2–3s for indexer before oracle fetches it
                                    setLogs(prev => [...prev, '🔮 Waiting for indexer, then calling Oracle for SAS Credential...']);
                                    await new Promise(resolve => setTimeout(resolve, 2500));
                                    setLogs(prev => [...prev, '🔮 Calling Oracle for SAS Credential...']);

                                    const r = await fetch('/api/issue-credential', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            signature: res.protocolFeeTxId,
                                            wallet: publicKey.toBase58(),
                                            network: selectedNetwork
                                        })
                                    });
                                    const data = await r.json().catch(() => ({}));
                                    if (data.success) {
                                        setLogs(prev => [...prev, `📜 SAS Credential Issued: ${data.attestation?.substring(0, 8) ?? '—'}...`]);
                                    } else {
                                        setLogs(prev => [...prev, `⚠️ Oracle: ${data.error || data.message || 'SAS issuance failed'}. On-chain verification is still valid.`]);
                                    }
                                } catch (e: unknown) {
                                    setLogs(prev => [...prev, `⚠️ Oracle call failed. On-chain verification is still valid. (${(e as Error)?.message ?? 'network error'})`]);
                                }
                            })();
                        }
                    }

                    if (!res.over18 && res.description) {
                        setLogs(prev => [...prev, `⚠️ Reason: ${res.description}`]);
                    }

                } catch (e: unknown) {
                    const err = e as Error & { getLogs?: () => Promise<string[]> };
                    let errorMessage = err?.message ?? String(e);
                    let detailedLogs: string[] = [];

                    if (e instanceof SendTransactionError) {
                        try {
                            const logs = await err?.getLogs?.();
                            if (logs) {
                                detailedLogs = logs.map((l: string) => `  [SIM] ${l}`);
                                errorMessage = `Simulation Failed: ${err?.message ?? ''}`;
                            }
                        } catch (_logErr) {
                            console.error('Failed to get transaction logs:', _logErr);
                        }
                    }

                    setError(errorMessage);
                    setLogs(prev => [
                        ...prev,
                        `💥 Fatal Error: ${errorMessage}`,
                        ...detailedLogs,
                        ...(err?.stack ? err.stack.split('\n').map((l: string) => `  ${l}`) : [])
                    ]);
                } finally {
                    setVerifying(false);
                    isRunningProtocol.current = false;
                }
            };

            execute();
        }
    }, [verifying]);

    const handleVerifyClick = async () => {
        if (!publicKey) {
            setWalletModalVisible(true);
            return;
        }

        // Pre-check balance before even showing the intro modal
        try {
            if (isVerifiedSession) {
                setError('Wallet is already verified on-chain. No further action needed.');
                return;
            }
            const currentBalance = await connection.getBalance(publicKey);
            if (currentBalance < RECOMMENDED_BALANCE_SOL * LAMPORTS_PER_SOL) {
                setError(`Insufficient balance. You need at least ${RECOMMENDED_BALANCE_SOL.toFixed(4)} SOL to cover the protocol fee, app fee and gas.`);
                return;
            }
        } catch {
            console.warn('Could not check balance, continuing to verification...');
        }

        const localStorageKey = 'solana-age-verify-first-user-seen';
        const hasSeenFirstUser = localStorage.getItem(localStorageKey);
        if (!hasSeenFirstUser) {
            setShowInitialLoading(true);
        } else {
            startVerification();
        }
    };

    // After initial loading spinner, show privacy/verification message modal
    useEffect(() => {
        if (!showInitialLoading) return;
        const t1 = setTimeout(() => {
            setShowInitialLoading(false);
            setShowFirstUserMessage(true);
            setCanContinue(false);
            setTimeout(() => setCanContinue(true), 1500);
        }, 800);
        return () => clearTimeout(t1);
    }, [showInitialLoading]);

    // Determine if we should show the video container (after wallet connected)


    return (
        <div className="app-shell" style={{
            minHeight: '100vh',
            paddingTop: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundPosition: 'center'
        }}>
            <Header
                onHome={() => setPage('home')}
                onSdkClick={() => { setPage('wiki'); window.scrollTo(0, 0); }}
                selectedNetwork={selectedNetwork}
                onNetworkChange={handleNetworkChange}
            />

            {page === 'tos' && <TermsOfService onBack={() => { setPage('home'); window.scrollTo(0, 0); }} />}
            {page === 'privacy' && <PrivacyPolicy onBack={() => { setPage('home'); window.scrollTo(0, 0); }} />}
            {page === 'help' && <Help onBack={() => { setPage('home'); window.scrollTo(0, 0); }} />}
            {page === 'wiki' && <Wiki onBack={() => { setPage('home'); window.scrollTo(0, 0); }} />}
            {page === 'how-it-works' && <HowItWorks onBack={() => { setPage('home'); window.scrollTo(0, 0); }} />}
            {page === 'hackathon' && <Hackathon onBack={() => { setPage('home'); window.scrollTo(0, 0); }} />}

            {showConnectModal && (
                <div className="fullscreen-overlay" style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }} onClick={(e) => {
                    if (e.target === e.currentTarget) setShowConnectModal(false);
                }}>
                    <div className="glass glass-shadow animate-fade-in" style={{
                        width: '100%',
                        maxWidth: '340px',
                        padding: '24px',
                        borderRadius: '20px',
                        background: '#0F172A',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowConnectModal(false)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '24px',
                                cursor: 'pointer'
                            }}
                        >
                            ×
                        </button>


                        <h3 style={{ fontSize: '20px', color: '#fff', margin: '8px 0 12px 0' }}>Connect Wallet</h3>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '24px', lineHeight: 1.4, fontSize: '14px' }}>
                            Please connect your Solana wallet to continue with age verification.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <WalletMultiButton />
                        </div>
                    </div>
                </div>
            )}

            {page === 'home' && (
                <>
                    {/* Header - Always Show for Stability */}
                    <div className="animate-fade-in" style={{ textAlign: 'center', maxWidth: '800px', padding: '0 20px 0 20px', position: 'relative', zIndex: 10 }}>
                        <img
                            src="/images/AgeVerify-App-Logo-512.png"
                            alt="Solana Age Verify"
                            style={{
                                width: '190px',
                                height: 'auto',
                                marginTop: '24px',
                                marginBottom: '24px',
                                filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
                            }}
                        />
                        <h2 style={{
                            fontSize: '42px',
                            fontWeight: '800',
                            color: '#fff',
                            margin: '0 0 24px 0',
                            maxWidth: '800px',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            lineHeight: '1.1',
                            letterSpacing: '-0.03em'
                        }}>
                            Verify as an adult on-chain in seconds. No ID needed.
                        </h2>

                        {!publicKey && (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                    <button
                                        onClick={() => setShowConnectModal(true)}
                                        style={{
                                            padding: '16px 48px',
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            borderRadius: '14px',
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 15px 30px -10px rgba(37, 99, 235, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(37, 99, 235, 0.4)';
                                        }}
                                    >
                                        Connect Wallet to Verify
                                    </button>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0' }}>
                                        Connect your wallet to begin. Total fee: ~0.003 SOL (protocol + app + network).
                                    </p>
                                    {error && (
                                        <p className="animate-fade-in" style={{ color: 'var(--error)', marginTop: '8px', fontSize: '14px', maxWidth: '400px', textAlign: 'center', margin: '8px 0 0 0' }}>
                                            {error}
                                        </p>
                                    )}

                                </div>
                            </>
                        )}
                    </div>


                    {/* Banner Area - Error & Status Messages (Above Video) */}
                    {(isVerifiedSession || error) && (
                        <div style={{ width: '100%', maxWidth: '640px', padding: '0 20px', marginBottom: '0px' }}>

                            {/* Persistent Verified Banner */}
                            {isVerifiedSession && !verifying && !result && (
                                <div className="animate-fade-in" style={{
                                    background: 'rgba(20, 241, 149, 0.1)',
                                    border: '1px solid rgba(20, 241, 149, 0.2)',
                                    borderRadius: '16px',
                                    padding: '16px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    color: '#14F195',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '20px' }}>✅</span>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px' }}>VERIFIED</div>
                                            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
                                                Previously verified on-chain{verifiedUntil ? ` · Valid until ${verifiedUntil}` : ''}.
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        background: '#14F195',
                                        color: '#000',
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        padding: '4px 8px',
                                        borderRadius: '6px'
                                    }}>
                                        ADULT
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="animate-fade-in" style={{
                                    padding: '16px 24px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '12px',
                                    color: 'var(--error)',
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}>
                                    <span style={{ fontSize: '18px' }}>⚠️</span>
                                    <div><strong>Protocol Error:</strong> {error}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Start Verification Button / Spinner - ALWAYS VISIBLE (Unless Result?) */}
                    {!result && publicKey && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4px' }}>
                            <button
                                onClick={handleVerifyClick}
                                disabled={verifying || isVerifiedSession}
                                style={{
                                    padding: '16px 48px',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    borderRadius: '14px',
                                    background: (verifying || isVerifiedSession) ? 'rgba(20, 241, 149, 0.1)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: (verifying || isVerifiedSession) ? '#14F195' : '#fff',
                                    border: (verifying || isVerifiedSession) ? '1px solid rgba(20, 241, 149, 0.2)' : 'none',
                                    cursor: (verifying || isVerifiedSession) ? 'default' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: (verifying || isVerifiedSession) ? 'none' : '0 10px 20px -5px rgba(37, 99, 235, 0.4)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!verifying && !isVerifiedSession) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 15px 30px -10px rgba(37, 99, 235, 0.5)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!verifying && !isVerifiedSession) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(37, 99, 235, 0.4)';
                                    }
                                }}
                            >
                                {verifying ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Spinner size={24} />
                                        <span>Verification in Progress...</span>
                                    </div>
                                ) : (isVerifiedSession ? 'Already Verified' : 'Start Verification')}
                            </button>

                            <p style={{ marginTop: '16px', fontSize: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                Total Fee: <strong>{TOTAL_FEE_SOL.toFixed(4)}&nbsp;SOL</strong>
                                <span style={{ display: 'block', marginTop: '4px', fontSize: '14px', opacity: 0.85 }}>
                                    Recommended balance: ≥ {RECOMMENDED_BALANCE_SOL.toFixed(4)}&nbsp;SOL
                                </span>
                                {balance !== null && (
                                    <span style={{ display: 'block', marginTop: '4px', opacity: 0.8, color: '#9945FF' }}>
                                        Current Balance: {balance.toFixed(4)}&nbsp;SOL
                                    </span>
                                )}
                                {error && (
                                    <span className="animate-fade-in" style={{ display: 'block', marginTop: '8px', color: 'var(--error)', fontWeight: '600' }}>
                                        {error}
                                    </span>
                                )}
                            </p>
                        </div>
                    )}

                    <div ref={instructionRef} className="instruction-shell animate-fade-in"></div>

                    {/* Video Container - Always visible when connected */}
                    <div ref={videoContainerRef} className="animate-fade-in" style={{
                        width: '100%',
                        maxWidth: '640px',
                        padding: '20px',
                        transition: 'max-width 0.3s ease'
                    }}>
                        <div className="glass glass-shadow" style={{
                            borderRadius: '24px',
                            // overflow: 'hidden', // Keep wrapper open; ui-overlay handles containment
                            width: '100%',
                            position: 'relative',
                            transition: 'border-radius 0.3s ease',
                            marginTop: '10px' // Add consistent margin
                        }}>

                            {/* Single Video Layer - persists across all states */}
                            <div className="video-aspect">
                                {/* Actually, if UI is inside THIS div, and this div has overflow hidden, it won't work.
                                                We need the UI to be a sibling of the clipped video, or parent not clipped.
                                            */}
                                <video
                                    ref={setVideoRef}
                                    className={`video-blur ${verifying ? 'video-blur-active' : ''}`}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transform: 'scaleX(-1)'
                                    }}
                                    muted
                                    autoPlay
                                    playsInline
                                />

                                {/* SDK UI Overlay - MOVED OUTSIDE OF CLIPPED VIDEO CONTAINER? 
                                                No, it needs to overlay video for the Face Guide.
                                                Solution: The wrapper (glass) is not clipped. The video element IS clipped (border radius).
                                                The UI layer is absolute, full width/height of wrapper.
                                            */}
                            </div>

                            {/* UI Overlay Wrapper - Absolute relative to the glass container, NOT the clipped video */}
                            <div ref={uiRef} className="ui-overlay" style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                pointerEvents: verifying || result?.over18 ? 'auto' : 'none',
                                zIndex: 50,
                                borderRadius: '24px'
                            }}></div>

                            {/* Camera Initialization Overlay - only in preview mode (Inside clipped video area effectively) */}
                            {!verifying && !result && !cameraReady && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.8)',
                                    color: 'var(--text-dim)',
                                    borderRadius: '20px',
                                    pointerEvents: 'none'
                                }}>
                                    <span style={{ fontSize: '14px' }}>Connect a wallet to begin verification...</span>
                                </div>
                            )}

                            {/* Green Light Indicator (Active Verification) */}
                            {verifying && !loadingModels && !result && (
                                <div style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: '#22c55e', // Green-500
                                    boxShadow: '0 0 12px #22c55e',
                                    zIndex: 60,
                                    animation: 'pulse-green 2s infinite'
                                }}></div>
                            )}

                            {/* Result Overlay */}
                            {result && !result.over18 && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    background: result.over18 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    backdropFilter: 'blur(20px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '40px',
                                    borderRadius: '24px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        fontSize: '64px',
                                        marginBottom: '20px',
                                        animation: 'fadeIn 0.5s ease-out'
                                    }}>
                                        {result.over18 ? '✅' : '❌'}
                                    </div>
                                    <h3 style={{ fontSize: '28px', color: '#fff', margin: 0 }}>
                                        {result.over18 ? 'Verified Successfully' : 'Verification Failed'}
                                    </h3>
                                    <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '12px' }}>
                                        {result.over18
                                            ? 'Your eligibility has been confirmed and anchored to the Solana network.'
                                            : (result.description || 'We could not verify your identity based on the current biometric criteria.')}
                                    </p>

                                    {result.over18 && result.userCode && (
                                        <div style={{
                                            marginTop: '20px',
                                            padding: '16px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                                                Your Unique ID
                                            </div>
                                            <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '0.2em', color: 'var(--primary)', textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>
                                                {result.userCode}
                                            </div>
                                        </div>
                                    )}

                                    {result.protocolFeeTxId && (
                                        <a
                                            href={`https://explorer.solana.com/tx/${result.protocolFeeTxId}`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='glass'
                                            style={{
                                                marginTop: '24px',
                                                padding: '12px 24px',
                                                borderRadius: '12px',
                                                color: '#fff',
                                                textDecoration: 'none',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            View On-Chain Proof ↗
                                        </a>
                                    )}

                                    <button
                                        onClick={() => { setResult(null); setError(''); }}
                                        style={{
                                            marginTop: '32px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'rgba(255,255,255,0.4)',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* About Inset - Restored */}
                    <div style={{
                        maxWidth: '640px',
                        width: '100%',
                        margin: '20px auto 60px',
                        padding: '0 20px'
                    }}>
                        <div style={{
                            padding: '20px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--text-muted)'
                        }}>
                            <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>Privacy & Security</strong>
                            Solana Age Verify uses zero-knowledge technology to verify you are 18+ without storing your biometric data.
                            Your face is analyzed locally to generate a cryptographic proof, which is the only thing sent to the blockchain.
                            No images are ever saved or transmitted.
                        </div>
                    </div>


                    {/* Error Message Moved Above Video */}

                    {/* Logger Toggle Button - Icon Only */}
                    {!showLogger && (
                        <button
                            onClick={() => setShowLogger(true)}
                            title="Show Protocol Logs"
                            style={{
                                position: 'fixed',
                                right: '24px',
                                bottom: 'calc(24px + env(safe-area-inset-bottom))',
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 99,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.color = 'var(--primary)';
                                e.currentTarget.style.borderColor = 'var(--primary)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.color = 'var(--text-muted)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="4 17 10 11 4 5"></polyline>
                                <line x1="12" y1="19" x2="20" y2="19"></line>
                            </svg>
                        </button>
                    )}

                    {/* Initial loading overlay: spinner first, then First User message */}
                    {showInitialLoading && (
                        <div className="fullscreen-overlay" style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(2, 6, 23, 0.8)',
                            backdropFilter: 'blur(10px)',
                            zIndex: 10000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div className="glass glass-shadow animate-fade-in" style={{
                                padding: '40px',
                                borderRadius: '32px',
                                maxWidth: '360px',
                                width: '90%',
                                textAlign: 'center'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                                    <Spinner size={48} />
                                </div>
                                <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '16px' }}>
                                    Preparing verification...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* First User Modal */}
                    {showFirstUserMessage && (
                        <div className="fullscreen-overlay" style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(2, 6, 23, 0.8)',
                            backdropFilter: 'blur(10px)',
                            zIndex: 10000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div className="glass glass-shadow animate-fade-in" style={{
                                padding: '40px',
                                borderRadius: '32px',
                                maxWidth: '440px',
                                width: '90%',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '24px' }}>💡</div>
                                <h2 style={{ margin: '0 0 16px', fontSize: '28px' }}>Verification Check</h2>
                                <p style={{ lineHeight: '1.6', color: 'var(--text-dim)', marginBottom: '32px' }}>
                                    For the best results, please ensure you are in a <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>well-lit room</span> and your face is fully visible to the camera.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowFirstUserMessage(false);
                                        localStorage.setItem('solana-age-verify-first-user-seen', 'true');
                                        startVerification();
                                    }}
                                    disabled={!canContinue}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        border: 'none',
                                        background: canContinue ? 'var(--primary)' : 'var(--bg-card)',
                                        color: canContinue ? '#fff' : 'var(--text-muted)',
                                        fontWeight: '700',
                                        fontSize: '16px',
                                        cursor: canContinue ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {canContinue ? 'Got it, let\'s go' : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                            <Spinner size={20} />
                                            <span>Initializing...</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )
            }

            {/* Footer */}
            <footer style={{
                marginTop: 'auto',
                width: '100%',
                padding: '40px 20px',
                paddingBottom: 'calc(40px + env(safe-area-inset-bottom))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                borderTop: '1px solid var(--border)',
                background: 'rgba(2, 6, 23, 0.4)'
            }}>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={() => { setPage('tos'); window.scrollTo(0, 0); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
                    >
                        Terms of Service
                    </button>
                    <button
                        onClick={() => { setPage('privacy'); window.scrollTo(0, 0); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
                    >
                        Privacy Policy
                    </button>
                    <button
                        onClick={() => { setPage('how-it-works'); window.scrollTo(0, 0); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
                    >
                        How it Works
                    </button>
                    <button
                        onClick={() => { setPage('help'); window.scrollTo(0, 0); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
                    >
                        Help Center
                    </button>
                    <button
                        onClick={() => { setPage('wiki'); window.scrollTo(0, 0); }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                    >
                        Developer SDK
                    </button>
                    <button
                        onClick={() => { setPage('hackathon'); window.scrollTo(0, 0); }}
                        style={{ background: 'none', border: 'none', color: '#ffb300', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                    >
                        Hackathon 🏆
                    </button>
                    <a
                        href="https://x.com/AVsolana"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}
                    >
                        X / Twitter
                    </a>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    © 2026 Solana Age Verify. Age verification powered by biometrics. v{SDK_VERSION}
                </div>
            </footer>

            {
                showLogger && (
                    <Logger
                        logs={logs}
                        isVisible={showLogger}
                        onToggle={() => setShowLogger(false)}
                        disableAutoScroll={result !== null}
                    />
                )
            }

            {
                (() => {
                    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
                    const isInternal = hostname === 'localhost' || hostname.endsWith('.vercel.app');
                    if (!isInternal) return null;

                    return (
                        <DebugPanel
                            connected={connected}
                            publicKey={publicKey}
                            network={selectedNetwork}
                            endpoint={connection.rpcEndpoint}
                            wallets={wallet ? [wallet] : []}
                        />
                    );
                })()
            }

            {
                page === 'home' && (
                    <style>{`
                            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                        `}</style>
                )
            }
        </div >
    );
}

// --- App Root ---

const NETWORK_STORAGE_KEY = 'sav-network';

function App() {
    // Network from state (persisted to localStorage); fallback to env then devnet
    const [selectedNetwork, setSelectedNetworkState] = useState<'devnet' | 'mainnet-beta'>(() => {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem(NETWORK_STORAGE_KEY);
            if (stored === 'devnet' || stored === 'mainnet-beta') return stored;
        }
        return (import.meta.env.VITE_SOLANA_NETWORK as string) === 'mainnet-beta' ? 'mainnet-beta' : 'devnet';
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(NETWORK_STORAGE_KEY, selectedNetwork);
        }
    }, [selectedNetwork]);

    const setSelectedNetwork = useCallback((n: 'devnet' | 'mainnet-beta') => setSelectedNetworkState(n), []);

    const network = selectedNetwork === 'mainnet-beta'
        ? WalletAdapterNetwork.Mainnet
        : WalletAdapterNetwork.Devnet;

    // Dual RPC: devnet vs mainnet env vars (VITE_HELIUS_MAIN_RPC_URL, VITE_QUICKNODE_MAIN_RPC_URL for mainnet)
    const heliusRpc = selectedNetwork === 'mainnet-beta'
        ? (import.meta.env.VITE_HELIUS_MAIN_RPC_URL || import.meta.env.VITE_HELIUS_RPC_URL)
        : (import.meta.env.VITE_HELIUS_RPC_URL || import.meta.env.helius_rpc_url || import.meta.env.HELIUS_RPC_URL);
    const quickNodeRpc = selectedNetwork === 'mainnet-beta'
        ? (import.meta.env.VITE_QUICKNODE_MAIN_RPC_URL || import.meta.env.VITE_QUICKNODE_RPC_URL)
        : (import.meta.env.VITE_QUICKNODE_RPC_URL || import.meta.env.quicknode_rpc_url || import.meta.env.QUICKNODE_RPC_URL);

    const endpoint = import.meta.env.VITE_RPC_URL || quickNodeRpc || heliusRpc;
    const statusEndpoint = heliusRpc || endpoint;

    if (!endpoint || (selectedNetwork === 'devnet' && endpoint.includes('api.devnet.solana.com'))) {
        console.warn('[App] No private RPC configured. Verification might fail under load.');
    }

    // Support both variable names, preferring NEW if set. Trim to handle accidental whitespace.
    const rawNew = import.meta.env.VITE_WALLETCONNECT_ID_NEW;
    const rawOld = import.meta.env.VITE_WALLETCONNECT_ID;
    const projectId = (rawNew && rawNew.trim() !== '') ? rawNew.trim() : (rawOld && rawOld.trim() !== '') ? rawOld.trim() : undefined;

    // DEBUG: Check Config
    useEffect(() => {
        console.log('[App Config] Network:', network);
        console.log('[App Config] RPC Endpoint:', endpoint);
        console.log('[App Config] WalletConnect Project ID:', projectId ? `${projectId.substring(0, 4)}...` : 'MISSING (Using Fallback internally)');
    }, []);

    // Connection configuration for better reliability
    const connectionConfig = useMemo(() => ({
        commitment: 'confirmed' as const,
        confirmTransactionInitialTimeout: 60000, // 60 seconds
    }), []);

    const statusConnection = useMemo(
        () => (statusEndpoint ? new Connection(statusEndpoint, connectionConfig) : null),
        [statusEndpoint, connectionConfig]
    );

    const wallets = useMemo(() => {
        // Simple mobile detection
        const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            console.log('[App] Mobile detected - Using WalletConnect ONLY');
            try {
                const walletConnectChainId = network === WalletAdapterNetwork.Mainnet
                    ? 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
                    : 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';

                return [
                    new WalletConnectWalletAdapter({
                        // WalletConnect chain ID format; adapter types expect WalletAdapterNetwork
                        network: walletConnectChainId as unknown as typeof WalletAdapterNetwork.Mainnet,
                        options: {
                            projectId: projectId || 'bd0fc67f310ffe51ddd9f88c13f6d8a6',
                            metadata: {
                                name: 'Solana Age Verify',
                                description: 'Solana Age Verification',
                                url: 'https://ageverify.live',
                                icons: ['https://ageverify.live/logo.png'],
                            },
                        },
                    })
                ];
            } catch (e: unknown) {
                console.error('Failed to init WalletConnect on mobile', e);
                return [];
            }
        }

        // Desktop: Extension Wallets ONLY (No WalletConnect as requested)
        return [
            new SolflareWalletAdapter(),
            new PhantomWalletAdapter(),
            new TrustWalletAdapter(),
        ];
    }, [network, projectId]);

    // Wallet error handler
    const onError = (error: unknown) => {
        const err = error as Error & { name?: string; code?: number };
        console.error('[Wallet Error]', error);

        // Extract meaningful message
        let msg = err?.message ?? 'Unknown Error';
        if (err?.name) msg = `${err.name}: ${msg}`;
        if (err?.code) msg = `${msg} (Code: ${err.code})`;

        // If message is still empty/useless, stringify the whole thing
        if (!msg || msg === 'Unknown Error') {
            try {
                if (err?.name === 'WalletNotReadyError') {
                    msg = 'Wallet Not Ready (Tip: On mobile, choose "WalletConnect" instead of Phantom/Solflare directly)';
                } else {
                    msg = JSON.stringify(error);
                }
            } catch {
                msg = 'Non-serializable Error';
            }
        } else if (err?.name === 'WalletNotReadyError') {
            msg += ' (Tip: On mobile, choose "WalletConnect" to link your app)';
        }

        const event = new CustomEvent<string>('sav-wallet-error', { detail: msg });
        window.dispatchEvent(event);
    };

    return (
        <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
            <WalletProvider wallets={wallets} autoConnect={false} onError={onError}>
                <WalletModalProvider>
                    <VerificationContent
                    statusConnection={statusConnection}
                    statusEndpoint={statusEndpoint ?? undefined}
                    selectedNetwork={selectedNetwork}
                    setSelectedNetwork={setSelectedNetwork}
                />
                </WalletModalProvider>
            </WalletProvider>
            <Analytics />
        </ConnectionProvider>
    );
}

export default App;
