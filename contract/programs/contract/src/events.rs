use anchor_lang::prelude::*;

#[event]
pub struct FactoryInitialized {
    pub authority: Pubkey,
    pub default_quorum: u64,
    pub default_voting_window: i64,
    pub platform_fee_percentage: u64,
    pub usdc_mint: Pubkey,
}

#[event]
pub struct CreatorPoolCreated {
    pub creator: Pubkey,
    pub pool: Pubkey,
    pub voting_quorum: u64,
    pub voting_window: i64,
}

#[event]
pub struct ClaimFiled {
    pub claim: Pubkey,
    pub creator: Pubkey,
    pub creator_pool: Pubkey,
    pub pool_amount: u64,
    pub evidence_ipfs_hash: String,
    pub voting_ends_at: i64,
}

#[event]
pub struct VoteCast {
    pub claim: Pubkey,
    pub voter: Pubkey,
    pub vote_choice: bool,
    pub voted_at: i64,
}

#[event]
pub struct ClaimFinalized {
    pub claim: Pubkey,
    pub creator: Pubkey,
    pub creator_pool: Pubkey,
    pub pool_amount: u64,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub status: String,
}

#[event]
pub struct ClaimCanceled {
    pub claim: Pubkey,
    pub creator: Pubkey,
    pub creator_pool: Pubkey,
}

#[event]
pub struct PayoutSent {
    pub claim: Pubkey,
    pub creator: Pubkey,
    pub creator_pool: Pubkey,
    pub payout_amount: u64,
}

#[event]
pub struct RefundDistributed {
    pub claim: Pubkey,
    pub creator_pool: Pubkey,
    pub total_refund_amount: u64,
    pub nft_holders_count: u64,
}

#[event]
pub struct NftOwnershipVerified {
    pub voter: Pubkey,
    pub nft_mint: Pubkey,
    pub creator: Pubkey,
}

#[event]
pub struct NftSaleRevenueDistributed {
    pub creator: Pubkey,
    pub creator_pool: Pubkey,
    pub total_amount: u64,
    pub creator_pool_amount: u64,
    pub creator_amount: u64,
    pub platform_fee: u64,
}
