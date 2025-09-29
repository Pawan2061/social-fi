use crate::events::CreatorPoolCreated;
use crate::state::{CreatorPool, Factory, PoolStatus};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

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

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        token::mint = usdc_mint,
        token::authority = creator_pool,
        seeds = [b"usdc_vault", creator.key().as_ref()],
        bump
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    pub factory: Account<'info, Factory>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
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

    #[account(
        mut,
        seeds = [b"usdc_vault", creator.key().as_ref()],
        bump
    )]
    pub usdc_vault: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(mut)]
    pub from_token_account: Account<'info, anchor_spl::token::TokenAccount>,

    pub usdc_mint: Account<'info, anchor_spl::token::Mint>,

    pub token_program: Program<'info, anchor_spl::token::Token>,
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

    #[account(
        mut,
        seeds = [b"usdc_vault", creator.key().as_ref()],
        bump
    )]
    pub usdc_vault: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(mut)]
    pub to_token_account: Account<'info, anchor_spl::token::TokenAccount>,

    pub usdc_mint: Account<'info, anchor_spl::token::Mint>,

    pub token_program: Program<'info, anchor_spl::token::Token>,
}

pub fn create_pool(
    ctx: Context<CreateCreatorPool>,
    voting_quorum: u64,
    voting_window: i64,
) -> Result<()> {
    let creator_pool = &mut ctx.accounts.creator_pool;
    let factory = &ctx.accounts.factory;

    creator_pool.creator = ctx.accounts.creator.key();

    creator_pool.usdc_mint = ctx.accounts.usdc_mint.key();
    creator_pool.usdc_vault = ctx.accounts.usdc_vault.key();

    creator_pool.total_deposited = 0;
    creator_pool.total_withdrawn = 0;

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

    let cpi_accounts = anchor_spl::token::Transfer {
        from: ctx.accounts.from_token_account.to_account_info(),
        to: ctx.accounts.usdc_vault.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    anchor_spl::token::transfer(cpi_ctx, amount)?;

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

    let creator_key = creator_pool.creator;
    let bump = creator_pool.bump;
    let seeds = &[b"creator_pool", creator_key.as_ref(), &[bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts = anchor_spl::token::Transfer {
        from: ctx.accounts.usdc_vault.to_account_info(),
        to: ctx.accounts.to_token_account.to_account_info(),
        authority: creator_pool.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    anchor_spl::token::transfer(cpi_ctx, amount)?;

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
