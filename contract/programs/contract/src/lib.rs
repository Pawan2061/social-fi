use anchor_lang::prelude::*;

declare_id!("D5vmmfjdBwwRhpjkXkAMTMEimuNb2PgS2HB3nxbczY4G");
pub mod events;
pub mod instructions;
pub mod state;
use crate::instructions::*;
#[program]
pub mod contract {
    use super::*;

    pub fn initialize_factory(
        ctx: Context<InitializeFactory>,
        default_quorum: u64,
        default_voting_window: i64,
        platform_fee_percentage: u64,
    ) -> Result<()> {
        instructions::initialize_factory(
            ctx,
            default_quorum,
            default_voting_window,
            platform_fee_percentage,
        )
    }

    pub fn create_pool(
        ctx: Context<CreateCreatorPool>,
        voting_quorum: u64,
        voting_window: i64,
    ) -> Result<()> {
        instructions::create_pool(ctx, voting_quorum, voting_window)
    }

    pub fn deposit_to_pool(ctx: Context<DepositToPool>, amount: u64) -> Result<()> {
        instructions::deposit_to_pool(ctx, amount)
    }

    pub fn withdraw_from_pool(ctx: Context<WithdrawFromPool>, amount: u64) -> Result<()> {
        instructions::withdraw_from_pool(ctx, amount)
    }
}
