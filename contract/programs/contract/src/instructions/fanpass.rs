use crate::events::NftSaleRevenueDistributed;
use crate::state::{CreatorPool, Factory};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct DepositFromNftSale<'info> {
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
    pub creator_pool_vault: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(mut)]
    pub creator_usdc_account: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(mut)]
    pub platform_usdc_account: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(mut)]
    pub from_token_account: Account<'info, anchor_spl::token::TokenAccount>,

    pub usdc_mint: Account<'info, anchor_spl::token::Mint>,

    pub factory: Account<'info, Factory>,

    pub token_program: Program<'info, anchor_spl::token::Token>,
}

#[derive(Accounts)]
pub struct VerifyFanPass<'info> {
    pub fan: Signer<'info>,

    pub nft_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(
        seeds = [b"creator_collection", nft_mint.key().as_ref()],
        bump
    )]
    pub creator_collection: Account<'info, crate::state::CreatorCollection>,

    #[account(
        seeds = [b"nft_ownership", nft_mint.key().as_ref()],
        bump
    )]
    pub nft_ownership: Account<'info, crate::state::NftOwnership>,
}

pub fn deposit_from_nft_sale(ctx: Context<DepositFromNftSale>, total_amount: u64) -> Result<()> {
    let creator_pool = &mut ctx.accounts.creator_pool;
    let factory = &ctx.accounts.factory;

    let platform_fee = (total_amount * factory.platform_fee_percentage) / 100;
    let creator_pool_amount = (total_amount * 70) / 100;
    let creator_amount = total_amount - platform_fee - creator_pool_amount;

    let cpi_accounts_pool = anchor_spl::token::Transfer {
        from: ctx.accounts.from_token_account.to_account_info(),
        to: ctx.accounts.creator_pool_vault.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx_pool = CpiContext::new(cpi_program.clone(), cpi_accounts_pool);
    anchor_spl::token::transfer(cpi_ctx_pool, creator_pool_amount)?;

    let cpi_accounts_creator = anchor_spl::token::Transfer {
        from: ctx.accounts.from_token_account.to_account_info(),
        to: ctx.accounts.creator_usdc_account.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };

    let cpi_ctx_creator = CpiContext::new(cpi_program.clone(), cpi_accounts_creator);
    anchor_spl::token::transfer(cpi_ctx_creator, creator_amount)?;

    let cpi_accounts_platform = anchor_spl::token::Transfer {
        from: ctx.accounts.from_token_account.to_account_info(),
        to: ctx.accounts.platform_usdc_account.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };

    let cpi_ctx_platform = CpiContext::new(cpi_program, cpi_accounts_platform);
    anchor_spl::token::transfer(cpi_ctx_platform, platform_fee)?;

    creator_pool.total_deposited = creator_pool
        .total_deposited
        .checked_add(creator_pool_amount)
        .ok_or(ErrorCode::MathOverflow)?;

    emit!(NftSaleRevenueDistributed {
        creator: creator_pool.creator,
        creator_pool: ctx.accounts.creator_pool.key(),
        total_amount,
        creator_pool_amount,
        creator_amount,
        platform_fee,
    });

    Ok(())
}

pub fn verify_fan_pass(ctx: Context<VerifyFanPass>) -> Result<()> {
    require!(
        ctx.accounts.nft_ownership.owner == ctx.accounts.fan.key(),
        ErrorCode::NotNftOwner
    );

    require!(
        ctx.accounts.nft_ownership.creator_collection == ctx.accounts.creator_collection.key(),
        ErrorCode::InvalidNftCollection
    );

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Not NFT owner")]
    NotNftOwner,
    #[msg("Invalid NFT collection")]
    InvalidNftCollection,
}
