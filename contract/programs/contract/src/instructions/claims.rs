use crate::events::{ClaimCanceled, ClaimFiled, ClaimFinalized, PayoutSent, RefundDistributed};
use crate::state::{Claim, CreatorPool, Factory};
use anchor_lang::prelude::*;
// No longer using SPL tokens

#[derive(Accounts)]
#[instruction(evidence_ipfs_hash: String, claim_count: u64, creator_pool_address: Pubkey)]
pub struct FileClaim<'info> {
    #[account(
        init,
        payer = creator,
        space = Claim::LEN,
        seeds = [b"claim", creator_pool_address.as_ref(), &claim_count.to_le_bytes()],
        bump
    )]
    pub claim: Account<'info, Claim>,

    #[account(mut)]
    pub creator_pool: Account<'info, CreatorPool>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: This is a regular account that can hold native SOL
    #[account(mut)]
    pub creator_usdc_account: AccountInfo<'info>,

    /// CHECK: This is a regular account that can hold native SOL
    #[account(mut)]
    pub creator_pool_vault: AccountInfo<'info>,

    pub factory: Account<'info, Factory>,

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

    /// CHECK: This is a regular account that can hold native SOL
    #[account(mut)]
    pub creator_usdc_account: AccountInfo<'info>,

    /// CHECK: This is a regular account that can hold native SOL
    #[account(mut)]
    pub creator_pool_vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
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

    /// CHECK: This is a regular account that can hold native SOL
    #[account(mut)]
    pub creator_pool_vault: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct FinalizeClaimWithDistribution<'info> {
    #[account(
        mut,
        has_one = creator_pool,
        constraint = (claim.status == crate::state::ClaimStatus::Voting || claim.status == crate::state::ClaimStatus::Pending) @ ErrorCode::InvalidClaimStatus,
        constraint = Clock::get()?.unix_timestamp >= claim.voting_ends_at @ ErrorCode::VotingStillActive
    )]
    pub claim: Account<'info, Claim>,

    #[account(mut)]
    pub creator_pool: Account<'info, CreatorPool>,

    /// CHECK: This is the SOL vault PDA
    #[account(
        mut,
        seeds = [b"sol_vault", creator_pool.creator.as_ref()],
        bump
    )]
    pub creator_pool_vault: AccountInfo<'info>,

    /// CHECK: This is a regular account that can hold native SOL
    #[account(mut)]
    pub creator_usdc_account: AccountInfo<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub factory: Account<'info, Factory>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeToNftHolder<'info> {
    #[account(
        mut,
        seeds = [b"creator_pool", creator_pool.creator.as_ref()],
        bump = creator_pool.bump
    )]
    pub creator_pool: Account<'info, CreatorPool>,

    /// CHECK: This is the SOL vault PDA
    #[account(
        mut,
        seeds = [b"sol_vault", creator_pool.creator.as_ref()],
        bump
    )]
    pub sol_vault: AccountInfo<'info>,

    /// CHECK: This is a regular account that can receive native SOL
    #[account(mut)]
    pub nft_holder: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
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
    #[msg("Invalid CreatorPool address provided")]
    InvalidCreatorPoolAddress,
}

pub fn file_claim(
    ctx: Context<FileClaim>,
    evidence_ipfs_hash: String,
    claim_count: u64,
    creator_pool_address: Pubkey,
) -> Result<()> {
    // Debug logging
    msg!(
        "Contract received creator_pool_address: {}",
        creator_pool_address
    );
    msg!("Contract received claim_count: {}", claim_count);
    msg!(
        "Contract received evidence_ipfs_hash: {}",
        evidence_ipfs_hash
    );
    msg!(
        "Contract creator_pool.key(): {}",
        ctx.accounts.creator_pool.key()
    );
    msg!(
        "Are addresses equal? {}",
        creator_pool_address == ctx.accounts.creator_pool.key()
    );

    let claim = &mut ctx.accounts.claim;
    let creator_pool = &mut ctx.accounts.creator_pool;

    // For native SOL vault, get the lamports
    let pool_balance = ctx.accounts.creator_pool_vault.lamports();

    claim.creator_pool = creator_pool.key();
    claim.creator = ctx.accounts.creator.key();
    claim.pool_amount_at_claim = pool_balance;
    claim.evidence_ipfs_hash = evidence_ipfs_hash;
    claim.status = crate::state::ClaimStatus::Voting;
    claim.yes_votes = 0;
    claim.no_votes = 0;
    claim.voting_started_at = Clock::get()?.unix_timestamp;
    claim.voting_ends_at = Clock::get()?.unix_timestamp + creator_pool.voting_window;
    claim.created_at = Clock::get()?.unix_timestamp;
    claim.bump = ctx.bumps.claim;

    // Update creator_pool.claim_count to be the maximum of current count and provided count + 1
    let new_claim_count = std::cmp::max(creator_pool.claim_count, (claim_count + 1).into());
    creator_pool.claim_count = new_claim_count;

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

    // For native SOL vault, get the lamports
    let payout_amount = ctx.accounts.creator_pool_vault.lamports();

    require!(payout_amount > 0, ErrorCode::InsufficientFunds);

    // Native SOL transfer - creator must sign the transaction
    // The vault is owned by the creator, so they can transfer from it
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.creator_pool_vault.to_account_info(),
                to: ctx.accounts.creator_usdc_account.to_account_info(),
            },
        ),
        payout_amount,
    )?;

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
    let _creator_pool = &mut ctx.accounts.creator_pool;

    // For native SOL vault, get the lamports
    let refund_amount = ctx.accounts.creator_pool_vault.lamports();

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

pub fn finalize_claim_with_distribution(ctx: Context<FinalizeClaimWithDistribution>) -> Result<()> {
    let claim = &mut ctx.accounts.claim;
    let creator_pool = &mut ctx.accounts.creator_pool;

    let total_votes = claim
        .yes_votes
        .checked_add(claim.no_votes)
        .ok_or(ErrorCode::MathOverflow)?;

    require!(
        total_votes >= creator_pool.voting_quorum,
        ErrorCode::InsufficientVotes
    );

    // For native SOL vault, get the lamports
    let payout_amount = ctx.accounts.creator_pool_vault.lamports();
    require!(payout_amount > 0, ErrorCode::InsufficientFunds);

    if claim.yes_votes > claim.no_votes {
        // Claim approved - transfer funds from vault to creator
        claim.status = crate::state::ClaimStatus::Approved;

        // Transfer from SOL vault using PDA authority
        let vault_bump = ctx.bumps.creator_pool_vault;
        let vault_seeds = &[b"sol_vault", creator_pool.creator.as_ref(), &[vault_bump]];
        let signer = &[&vault_seeds[..]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.creator_pool_vault.to_account_info(),
                    to: ctx.accounts.creator_usdc_account.to_account_info(),
                },
                signer,
            ),
            payout_amount,
        )?;

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
    } else {
        // Claim rejected - funds stay in vault for NFT holder distribution
        claim.status = crate::state::ClaimStatus::Refunded;

        emit!(RefundDistributed {
            claim: claim.key(),
            creator_pool: claim.creator_pool,
            total_refund_amount: payout_amount,
            nft_holders_count: 0, // Backend will handle actual distribution
        });
    }

    emit!(ClaimFinalized {
        claim: claim.key(),
        creator: claim.creator,
        creator_pool: claim.creator_pool,
        pool_amount: claim.pool_amount_at_claim,
        yes_votes: claim.yes_votes,
        no_votes: claim.no_votes,
        status: match claim.status {
            crate::state::ClaimStatus::Paid => "Paid".to_string(),
            crate::state::ClaimStatus::Refunded => "Refunded".to_string(),
            _ => "Unknown".to_string(),
        },
    });

    Ok(())
}

pub fn distribute_to_nft_holder(ctx: Context<DistributeToNftHolder>, amount: u64) -> Result<()> {
    let vault_bump = ctx.bumps.sol_vault;
    let vault_seeds = &[
        b"sol_vault",
        ctx.accounts.creator_pool.creator.as_ref(),
        &[vault_bump],
    ];
    let signer = &[&vault_seeds[..]];

    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.sol_vault.to_account_info(),
                to: ctx.accounts.nft_holder.to_account_info(),
            },
            signer,
        ),
        amount,
    )?;

    Ok(())
}
