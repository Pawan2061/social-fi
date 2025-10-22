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

    /// CHECK: This is the SOL vault PDA
    #[account(
        mut,
        seeds = [b"sol_vault", creator.key().as_ref()],
        bump
    )]
    pub sol_vault: AccountInfo<'info>,

    /// CHECK: This is a regular account that can receive native SOL
    #[account(mut)]
    pub creator_wallet: AccountInfo<'info>,

    /// CHECK: This is a regular account that can receive native SOL
    #[account(mut)]
    pub platform_wallet: AccountInfo<'info>,

    pub factory: Account<'info, Factory>,

    pub system_program: Program<'info, System>,
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
    let vault_amount = (total_amount * 70) / 100; // 70% to vault
    let creator_amount = total_amount - platform_fee - vault_amount;

    // Transfer to SOL vault using PDA authority
    let vault_bump = ctx.bumps.sol_vault;
    let vault_seeds = &[b"sol_vault", creator_pool.creator.as_ref(), &[vault_bump]];
    let signer = &[&vault_seeds[..]];

    // Transfer to vault (locked until claim resolution)
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.sol_vault.to_account_info(),
            },
            signer,
        ),
        vault_amount,
    )?;

    // Transfer to creator (immediate)
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.creator_wallet.to_account_info(),
            },
        ),
        creator_amount,
    )?;

    // Transfer to platform
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.platform_wallet.to_account_info(),
            },
        ),
        platform_fee,
    )?;

    creator_pool.total_deposited = creator_pool
        .total_deposited
        .checked_add(vault_amount)
        .ok_or(ErrorCode::MathOverflow)?;

    emit!(NftSaleRevenueDistributed {
        creator: creator_pool.creator,
        creator_pool: ctx.accounts.creator_pool.key(),
        total_amount,
        creator_pool_amount: vault_amount,
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
