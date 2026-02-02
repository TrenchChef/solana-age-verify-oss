use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

declare_id!("AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q");

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "AgeVerify",
    project_url: "https://ageverify.live",
    contacts: "email:security@ageverify.live,link:https://github.com/TrenchChef/solana-age-verify-oss/blob/main/SECURITY.md",
    policy: "https://github.com/TrenchChef/solana-age-verify-oss/blob/main/SECURITY.md",
    source_code: "https://github.com/TrenchChef/solana-age-verify-oss"
}

/// Size constants for VerificationRecord (optimized)
/// discriminator: 8 + facehash: 32 + user_code: 4+5 + over_18: 1 + verified_at: 8 + expires_at: 8 + bump: 1 = 67 bytes
const VERIFICATION_RECORD_SIZE: usize = 8 + 32 + (4 + 5) + 1 + 8 + 8 + 1;

#[program]
pub mod age_registry {
    use super::*;

    /// Create a verification record for a user.
    pub fn create_verification(
        ctx: Context<CreateVerification>,
        facehash: [u8; 32], 
        verified_at: i64,
        over_18: bool,
        app_fee: u64,
    ) -> Result<()> {
        let (_, bump) = Pubkey::find_program_address(
            &[b"verification", ctx.accounts.authority.key().as_ref()],
            ctx.program_id,
        );
        let mut accounts = AccountsBundle {
            verification_record: &mut ctx.accounts.verification_record,
            authority: &ctx.accounts.authority,
            payer: &ctx.accounts.payer,
            protocol_treasury: &ctx.accounts.protocol_treasury,
            app_treasury: &ctx.accounts.app_treasury,
            system_program: &ctx.accounts.system_program,
            bump,
        };
        process_verification(&mut accounts, facehash, verified_at, over_18, app_fee, true)
    }

    /// Update an existing verification record (re-verification after expiry).
    pub fn update_verification(
        ctx: Context<UpdateVerification>,
        facehash: [u8; 32], 
        verified_at: i64,
        over_18: bool,
        app_fee: u64,
    ) -> Result<()> {
        let bump = ctx.accounts.verification_record.bump;
        let mut accounts = AccountsBundle {
            verification_record: &mut ctx.accounts.verification_record,
            authority: &ctx.accounts.authority,
            payer: &ctx.accounts.payer,
            protocol_treasury: &ctx.accounts.protocol_treasury,
            app_treasury: &ctx.accounts.app_treasury,
            system_program: &ctx.accounts.system_program,
            bump,
        };
        process_verification(&mut accounts, facehash, verified_at, over_18, app_fee, false)
    }

    /// Close a verification record and return rent to payer.
    pub fn close_verification(_ctx: Context<CloseVerification>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateVerification<'info> {
    /// The verification record PDA, keyed by authority's public key.
    #[account(
        init_if_needed,
        payer = payer,
        space = VERIFICATION_RECORD_SIZE,
        seeds = [b"verification", authority.key().as_ref()],
        bump
    )]
    pub verification_record: Account<'info, VerificationRecord>,

    /// The user being verified (wallet owner).
    pub authority: Signer<'info>,

    /// The account paying for transaction fees and rent.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Protocol treasury receiving the protocol fee.
    #[account(
        mut, 
        address = pubkey!("vrFYXf63CSksNdhCm183AnX6ogoLV53cT3eMU7TktXi")
    )]
    /// CHECK: Verified by address constraint
    pub protocol_treasury: AccountInfo<'info>,

    /// App treasury receiving optional app fee.
    #[account(mut)]
    /// CHECK: Verified by client
    pub app_treasury: AccountInfo<'info>,

    /// Gatekeeper signer (platform key for authorization).
    #[account(
        signer,
        address = pubkey!("vrFYXf63CSksNdhCm183AnX6ogoLV53cT3eMU7TktXi")
    )]
    /// CHECK: Verified by address constraint
    pub gatekeeper: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateVerification<'info> {
    /// The existing verification record PDA.
    #[account(
        mut,
        seeds = [b"verification", authority.key().as_ref()],
        bump = verification_record.bump
    )]
    pub verification_record: Account<'info, VerificationRecord>,

    /// The user being verified (wallet owner).
    pub authority: Signer<'info>,

    /// The account paying for transaction fees.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Protocol treasury receiving the protocol fee.
    #[account(
        mut, 
        address = pubkey!("vrFYXf63CSksNdhCm183AnX6ogoLV53cT3eMU7TktXi")
    )]
    /// CHECK: Verified by address constraint
    pub protocol_treasury: AccountInfo<'info>,

    /// App treasury receiving optional app fee.
    #[account(mut)]
    /// CHECK: Verified by client
    pub app_treasury: AccountInfo<'info>,

    /// Gatekeeper signer (platform key for authorization).
    #[account(
        signer,
        address = pubkey!("vrFYXf63CSksNdhCm183AnX6ogoLV53cT3eMU7TktXi")
    )]
    /// CHECK: Verified by address constraint
    pub gatekeeper: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseVerification<'info> {
    /// The verification record to close.
    #[account(
        mut,
        close = payer,
        seeds = [b"verification", authority.key().as_ref()],
        bump = verification_record.bump
    )]
    pub verification_record: Account<'info, VerificationRecord>,

    /// The record owner.
    pub authority: Signer<'info>,

    /// Receives the rent.
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[account]
pub struct VerificationRecord {
    /// SHA-256 hash of the face embedding + wallet + salt.
    pub facehash: [u8; 32],
    /// 5-character alphanumeric user code (only for over_18).
    pub user_code: String,
    /// Whether the user is verified as 18+.
    pub over_18: bool,
    /// Unix timestamp when verification was performed.
    pub verified_at: i64,
    /// Unix timestamp when verification expires.
    pub expires_at: i64,
    /// PDA bump seed.
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Verification is still valid.")]
    VerificationStillValid,
    #[msg("Timestamp overflow.")]
    TimestampOverflow,
}

fn process_verification(
    accounts: &mut AccountsBundle,
    facehash: [u8; 32],
    verified_at: i64,
    over_18: bool,
    app_fee: u64,
    is_create: bool,
) -> Result<()> {
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    if !is_create && accounts.verification_record.expires_at > current_time {
        return err!(ErrorCode::VerificationStillValid);
    }

    transfer_fees(accounts, app_fee)?;

    let record = &mut accounts.verification_record;
    if over_18 && record.user_code.is_empty() {
        record.user_code = derive_user_code(record.key());
    }

    let duration = if over_18 { DAYS_90 } else { DAYS_30 };

    if is_create {
        record.bump = accounts.bump;
    }
    record.facehash = facehash;
    record.verified_at = verified_at;
    record.expires_at = current_time
        .checked_add(duration)
        .ok_or(ErrorCode::TimestampOverflow)?;
    record.over_18 = over_18;

    Ok(())
}

/// Bundle to make the shared helper signature concise.
struct AccountsBundle<'info, 'a> {
    verification_record: &'a mut Account<'info, VerificationRecord>,
    authority: &'a Signer<'info>,
    payer: &'a Signer<'info>,
    protocol_treasury: &'a AccountInfo<'info>,
    app_treasury: &'a AccountInfo<'info>,
    system_program: &'a Program<'info, System>,
    bump: u8,
}

fn transfer_fees(accounts: &AccountsBundle, app_fee: u64) -> Result<()> {
    let protocol_cpi = CpiContext::new(
        accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: accounts.payer.to_account_info(),
            to: accounts.protocol_treasury.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(protocol_cpi, PROTOCOL_FEE)?;

    if app_fee > 0 {
        let app_cpi = CpiContext::new(
            accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: accounts.payer.to_account_info(),
                to: accounts.app_treasury.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(app_cpi, app_fee)?;
    }

    Ok(())
}

fn derive_user_code(pda: Pubkey) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNPQRSTUVWXYZ23456789";
    let pda_bytes = pda.to_bytes();
    let mut code_bytes: [u8; 5] = [0; 5];
    let mut i = 0;
    while i < 5 {
        let idx = ((pda_bytes[i] ^ pda_bytes[i + 5]) as usize) % CHARSET.len();
        code_bytes[i] = CHARSET[idx];
        i += 1;
    }
    // CHARSET is ASCII; we only write CHARSET bytes, so valid UTF-8.
    String::from_utf8(code_bytes.to_vec()).unwrap()
}

const DAYS_90: i64 = 90 * 24 * 60 * 60;   // adults
const DAYS_30: i64 = 30 * 24 * 60 * 60;   // minors
const PROTOCOL_FEE: u64 = 500_000; // 0.0005 SOL
