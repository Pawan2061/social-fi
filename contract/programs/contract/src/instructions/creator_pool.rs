use crate::events::CreatorPoolCreated;
use crate::state::{CreatorPool, Factory, PoolStatus};
use anchor_lang::prelude::*;
// No longer using SPL tokens

#[derive(Accounts)]
pub struct CreateCreatorPool<'info> {
    #[account(
        init,
        payer = creator,
        space = CreatorPool::LEN,
        seeds = [b"creator_pool", creator.key().as_ref()],
        bump
    )]
    pub creator_pool: Account<'info, CreatorPool>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: This is a PDA vault that holds native SOL
    #[account(
        init,
        payer = creator,
        space = 0, // Native SOL account needs no space
        seeds = [b"sol_vault", creator.key().as_ref()],
        bump
    )]
    pub sol_vault: AccountInfo<'info>,

    pub factory: Account<'info, Factory>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositToPool<'info> {
    #[account(
        mut,
        seeds = [b"creator_pool", creator.key().as_ref()],
        bump = creator_pool.bump
    )]
    pub creator_pool: Account<'info, CreatorPool>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: This is a regular account that can hold native SOL
    #[account(mut)]
    pub usdc_vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFromPool<'info> {
    #[account(
        mut,
        seeds = [b"creator_pool", creator.key().as_ref()],
        bump = creator_pool.bump,
        constraint = creator_pool.creator == creator.key()
    )]
    pub creator_pool: Account<'info, CreatorPool>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: This is a regular account that can hold native SOL
    #[account(mut)]
    pub usdc_vault: AccountInfo<'info>,

    /// CHECK: This is a regular account that can hold native SOL
    #[account(mut)]
    pub to_token_account: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn create_pool(
    ctx: Context<CreateCreatorPool>,
    voting_quorum: u64,
    voting_window: i64,
) -> Result<()> {
    let creator_pool = &mut ctx.accounts.creator_pool;
    let factory = &ctx.accounts.factory;

    creator_pool.creator = ctx.accounts.creator.key();
    creator_pool.usdc_mint = Pubkey::default(); // No longer using USDC mint
    creator_pool.usdc_vault = ctx.accounts.sol_vault.key(); // Store SOL vault address
    creator_pool.total_deposited = 0;
    creator_pool.total_withdrawn = 0;
    creator_pool.claim_count = 0;

    creator_pool.voting_quorum = if voting_quorum > 0 {
        voting_quorum
    } else {
        factory.default_quorum
    };
    creator_pool.voting_window = if voting_window > 0 {
        voting_window
    } else {
        factory.default_voting_window
    };

    creator_pool.status = PoolStatus::Active;
    creator_pool.bump = ctx.bumps.creator_pool;

    // Initialize SOL vault with rent exemption
    let vault_bump = ctx.bumps.sol_vault;
    let vault_seeds = &[b"sol_vault", creator_pool.creator.as_ref(), &[vault_bump]];
    let signer = &[&vault_seeds[..]];

    // Transfer minimum SOL for rent exemption
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.sol_vault.to_account_info(),
            },
            signer,
        ),
        1000000, // 0.001 SOL for rent exemption
    )?;

    let pool_key = creator_pool.key();
    let creator_key = creator_pool.creator;
    let voting_quorum = creator_pool.voting_quorum;
    let voting_window = creator_pool.voting_window;

    emit!(CreatorPoolCreated {
        creator: creator_key,
        pool: pool_key,
        voting_quorum,
        voting_window,
    });

    Ok(())
}

pub fn deposit_to_pool(ctx: Context<DepositToPool>, amount: u64) -> Result<()> {
    let creator_pool = &mut ctx.accounts.creator_pool;

    // For native SOL, we use SystemProgram::transfer
    let transfer_instruction = anchor_lang::system_program::Transfer {
        from: ctx.accounts.creator.to_account_info(),
        to: ctx.accounts.usdc_vault.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        transfer_instruction,
    );

    anchor_lang::system_program::transfer(cpi_ctx, amount)?;

    creator_pool.total_deposited = creator_pool
        .total_deposited
        .checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;

    Ok(())
}

pub fn withdraw_from_pool(ctx: Context<WithdrawFromPool>, amount: u64) -> Result<()> {
    let creator_pool = &mut ctx.accounts.creator_pool;

    require!(
        amount <= creator_pool.total_deposited - creator_pool.total_withdrawn,
        ErrorCode::InsufficientFunds
    );

    // For native SOL, we use regular transfer since vault is owned by creator
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.usdc_vault.to_account_info(),
                to: ctx.accounts.to_token_account.to_account_info(),
            },
        ),
        amount,
    )?;

    creator_pool.total_withdrawn = creator_pool
        .total_withdrawn
        .checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Insufficient funds")]
    InsufficientFunds,
}
