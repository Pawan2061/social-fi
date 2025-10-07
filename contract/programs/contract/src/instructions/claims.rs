use crate::events::{ClaimCanceled, ClaimFiled, ClaimFinalized, PayoutSent, RefundDistributed};
use crate::state::{Claim, CreatorPool, Factory};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
#[instruction(evidence_ipfs_hash: String)]
pub struct FileClaim<'info> {
    #[account(
        init,
        payer = creator,
        space = Claim::LEN,
        seeds = [b"claim", creator_pool.key().as_ref(), &creator_pool.claim_count.to_le_bytes()],
        bump
    )]
    pub claim: Account<'info, Claim>,

    #[account(mut)]
    pub creator_pool: Account<'info, CreatorPool>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    pub creator_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator_pool_vault: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, token::Mint>,

    pub factory: Account<'info, Factory>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelClaim<'info> {
    #[account(
        mut,
        has_one = creator,
        constraint = claim.status == crate::state::ClaimStatus::Pending @ ErrorCode::InvalidClaimStatus
    )]
    pub claim: Account<'info, Claim>,

    #[account(mut)]
    pub creator_pool: Account<'info, CreatorPool>,

    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct FinalizeClaim<'info> {
    #[account(
        mut,
        has_one = creator_pool,
        constraint = claim.status == crate::state::ClaimStatus::Voting @ ErrorCode::InvalidClaimStatus,
        constraint = Clock::get()?.unix_timestamp >= claim.voting_ends_at @ ErrorCode::VotingStillActive
    )]
    pub claim: Account<'info, Claim>,

    #[account(mut)]
    pub creator_pool: Account<'info, CreatorPool>,

    pub factory: Account<'info, Factory>,
}

#[derive(Accounts)]
pub struct PayoutClaim<'info> {
    #[account(
        mut,
        has_one = creator_pool,
        constraint = claim.status == crate::state::ClaimStatus::Approved @ ErrorCode::InvalidClaimStatus
    )]
    pub claim: Account<'info, Claim>,

    #[account(mut)]
    pub creator_pool: Account<'info, CreatorPool>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    pub creator_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator_pool_vault: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, token::Mint>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundClaim<'info> {
    #[account(
        mut,
        has_one = creator_pool,
        constraint = claim.status == crate::state::ClaimStatus::Rejected @ ErrorCode::InvalidClaimStatus
    )]
    pub claim: Account<'info, Claim>,

    #[account(mut)]
    pub creator_pool: Account<'info, CreatorPool>,

    #[account(mut)]
    pub creator_pool_vault: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, token::Mint>,

    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid claim status for this operation")]
    InvalidClaimStatus,
    #[msg("Voting is still active")]
    VotingStillActive,
    #[msg("Insufficient votes to meet quorum")]
    InsufficientVotes,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Insufficient funds")]
    InsufficientFunds,
}

pub fn file_claim(ctx: Context<FileClaim>, evidence_ipfs_hash: String) -> Result<()> {
    let claim = &mut ctx.accounts.claim;
    let creator_pool = &mut ctx.accounts.creator_pool;

    let pool_balance = ctx.accounts.creator_pool_vault.amount;

    claim.creator_pool = creator_pool.key();
    claim.creator = ctx.accounts.creator.key();
    claim.pool_amount_at_claim = pool_balance;
    claim.evidence_ipfs_hash = evidence_ipfs_hash;
    claim.status = crate::state::ClaimStatus::Pending;
    claim.yes_votes = 0;
    claim.no_votes = 0;
    claim.voting_started_at = Clock::get()?.unix_timestamp;
    claim.voting_ends_at = Clock::get()?.unix_timestamp + creator_pool.voting_window;
    claim.created_at = Clock::get()?.unix_timestamp;
    claim.bump = ctx.bumps.claim;

    creator_pool.claim_count = creator_pool
        .claim_count
        .checked_add(1)
        .ok_or(ErrorCode::MathOverflow)?;

    emit!(ClaimFiled {
        claim: claim.key(),
        creator: claim.creator,
        creator_pool: claim.creator_pool,
        pool_amount: claim.pool_amount_at_claim,
        evidence_ipfs_hash: claim.evidence_ipfs_hash.clone(),
        voting_ends_at: claim.voting_ends_at,
    });

    Ok(())
}

pub fn cancel_claim(ctx: Context<CancelClaim>) -> Result<()> {
    let claim = &mut ctx.accounts.claim;

    require!(
        Clock::get()?.unix_timestamp < claim.voting_started_at,
        ErrorCode::InvalidClaimStatus
    );

    claim.status = crate::state::ClaimStatus::Canceled;

    emit!(ClaimCanceled {
        claim: claim.key(),
        creator: claim.creator,
        creator_pool: claim.creator_pool,
    });

    Ok(())
}

pub fn finalize_claim(ctx: Context<FinalizeClaim>) -> Result<()> {
    let claim = &mut ctx.accounts.claim;
    let creator_pool = &ctx.accounts.creator_pool;

    let total_votes = claim
        .yes_votes
        .checked_add(claim.no_votes)
        .ok_or(ErrorCode::MathOverflow)?;

    require!(
        total_votes >= creator_pool.voting_quorum,
        ErrorCode::InsufficientVotes
    );

    if claim.yes_votes > claim.no_votes {
        claim.status = crate::state::ClaimStatus::Approved;
    } else {
        claim.status = crate::state::ClaimStatus::Rejected;
    }

    emit!(ClaimFinalized {
        claim: claim.key(),
        creator: claim.creator,
        creator_pool: claim.creator_pool,
        pool_amount: claim.pool_amount_at_claim,
        yes_votes: claim.yes_votes,
        no_votes: claim.no_votes,
        status: match claim.status {
            crate::state::ClaimStatus::Approved => "Approved".to_string(),
            crate::state::ClaimStatus::Rejected => "Rejected".to_string(),
            _ => "Unknown".to_string(),
        },
    });

    Ok(())
}

pub fn payout_claim(ctx: Context<PayoutClaim>) -> Result<()> {
    let claim = &mut ctx.accounts.claim;
    let creator_pool = &mut ctx.accounts.creator_pool;

    let payout_amount = ctx.accounts.creator_pool_vault.amount;

    require!(payout_amount > 0, ErrorCode::InsufficientFunds);

    let pool_bump = creator_pool.bump;
    let creator_key = claim.creator;

    let cpi_accounts = Transfer {
        from: ctx.accounts.creator_pool_vault.to_account_info(),
        to: ctx.accounts.creator_usdc_account.to_account_info(),
        authority: creator_pool.to_account_info(),
    };

    let seeds = &[b"creator_pool", creator_key.as_ref(), &[pool_bump]];
    let signer = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );

    token::transfer(cpi_ctx, payout_amount)?;

    creator_pool.total_withdrawn = creator_pool
        .total_withdrawn
        .checked_add(payout_amount)
        .ok_or(ErrorCode::MathOverflow)?;

    claim.status = crate::state::ClaimStatus::Paid;

    emit!(PayoutSent {
        claim: claim.key(),
        creator: claim.creator,
        creator_pool: claim.creator_pool,
        payout_amount,
    });

    Ok(())
}

pub fn refund_claim(ctx: Context<RefundClaim>) -> Result<()> {
    let claim = &mut ctx.accounts.claim;
    let creator_pool = &mut ctx.accounts.creator_pool;

    let refund_amount = ctx.accounts.creator_pool_vault.amount;

    require!(refund_amount > 0, ErrorCode::InsufficientFunds);

    claim.status = crate::state::ClaimStatus::Refunded;

    emit!(RefundDistributed {
        claim: claim.key(),
        creator_pool: claim.creator_pool,
        total_refund_amount: refund_amount,
        nft_holders_count: 0,
    });

    Ok(())
}
