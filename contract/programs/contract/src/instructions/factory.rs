use crate::events::FactoryInitialized;
use crate::state::Factory;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[derive(Accounts)]
pub struct InitializeFactory<'info> {
    #[account(
        init,
        payer = authority,
        space = Factory::LEN,
        seeds = [b"factory"],
        bump
    )]
    pub factory: Account<'info, Factory>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub usdc_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_factory(
    ctx: Context<InitializeFactory>,
    default_quorum: u64,
    default_voting_window: i64,
    platform_fee_percentage: u64,
) -> Result<()> {
    let factory = &mut ctx.accounts.factory;
    factory.authority = ctx.accounts.authority.key();
    factory.default_quorum = default_quorum;
    factory.default_voting_window = default_voting_window;
    factory.platform_fee_percentage = platform_fee_percentage;
    factory.usdc_mint = ctx.accounts.usdc_mint.key();
    factory.bump = ctx.bumps.factory;
    emit!(FactoryInitialized {
        authority: factory.authority,
        default_quorum: factory.default_quorum,
        default_voting_window: factory.default_voting_window,
        platform_fee_percentage: factory.platform_fee_percentage,
        usdc_mint: factory.usdc_mint,
    });

    Ok(())
}
