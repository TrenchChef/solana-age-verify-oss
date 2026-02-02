/**
 * Fee constants for the demo app. Source of truth for UI and balance checks.
 * See docs/FEES.md for exact cost breakdown and "we will adjust" note.
 */

const LAMPORTS_PER_SOL = 1_000_000_000;

/** Solana base fee per signature (one signer per verification tx). */
export const BASE_SIGN_LAMPORTS = 5_000;
/** Rent-exempt minimum for VerificationRecord PDA (67 bytes). Mainnet-typical; use getMinimumBalanceForRentExemption(67) at runtime if needed. */
export const PDA_RENT_67_LAMPORTS = 911_760;
/** Protocol fee (fixed). See docs/specs/IMMUTABLES.md. */
export const PROTOCOL_FEE_LAMPORTS = 500_000;
/** Demo app fee. */
export const APP_FEE_LAMPORTS = 1_000_000;

/** Exact on-chain total: base + PDA rent + protocol + app. */
export const EXACT_TOTAL_LAMPORTS =
  BASE_SIGN_LAMPORTS + PDA_RENT_67_LAMPORTS + PROTOCOL_FEE_LAMPORTS + APP_FEE_LAMPORTS;

/** Protocol fee (fixed). See docs/specs/IMMUTABLES.md. */
export const PROTOCOL_FEE_SOL = 0.0005;

/** Demo app fee. */
export const APP_FEE_SOL = 0.001;

/** Gas buffer for verification tx. */
export const GAS_BUFFER_SOL = 0.001;

/** Total fee displayed to user (protocol + app + nominal network). */
export const TOTAL_FEE_SOL = 0.003;

/** Recommended min balance to run verification (displayed to user). */
export const RECOMMENDED_BALANCE_SOL = 0.003;

/** Exact total in SOL (base + PDA rent + protocol + app). */
export const EXACT_TOTAL_SOL = EXACT_TOTAL_LAMPORTS / LAMPORTS_PER_SOL;
