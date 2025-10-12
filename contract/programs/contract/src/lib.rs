use anchor_lang::prelude::*;

declare_id!("BqHTWrkNFvj9ZA24yFkcTiXdczrNuQpspknnt3tWabVF");
pub mod events;
pub mod instructions;
pub mod state;
use crate::instructions::*;
use crate::state::VoteChoice;

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

    pub fn deposit_from_nft_sale(
        ctx: Context<DepositFromNftSale>,
        total_amount: u64,
    ) -> Result<()> {
        instructions::deposit_from_nft_sale(ctx, total_amount)
    }

    pub fn verify_fan_pass(ctx: Context<VerifyFanPass>) -> Result<()> {
        instructions::verify_fan_pass(ctx)
    }

    pub fn file_claim(ctx: Context<FileClaim>, evidence_ipfs_hash: String) -> Result<()> {
        instructions::file_claim(ctx, evidence_ipfs_hash)
    }

    pub fn cancel_claim(ctx: Context<CancelClaim>) -> Result<()> {
        instructions::cancel_claim(ctx)
    }

    pub fn finalize_claim(ctx: Context<FinalizeClaim>) -> Result<()> {
        instructions::finalize_claim(ctx)
    }

    pub fn payout_claim(ctx: Context<PayoutClaim>) -> Result<()> {
        instructions::payout_claim(ctx)
    }

    pub fn refund_claim(ctx: Context<RefundClaim>) -> Result<()> {
        instructions::refund_claim(ctx)
    }

    pub fn vote(ctx: Context<Vote>, choice: VoteChoice) -> Result<()> {
        instructions::vote(ctx, choice)
    }

    pub fn change_vote(ctx: Context<ChangeVote>, new_choice: VoteChoice) -> Result<()> {
        instructions::change_vote(ctx, new_choice)
    }
}
