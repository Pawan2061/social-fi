use anchor_lang::prelude::*;

#[account]
pub struct Claim {
    pub creator_pool: Pubkey,

    pub creator: Pubkey,

    pub pool_amount_at_claim: u64,

    pub evidence_ipfs_hash: String,

    pub status: ClaimStatus,

    pub yes_votes: u64,

    pub no_votes: u64,

    pub voting_started_at: i64,

    pub voting_ends_at: i64,

    pub created_at: i64,

    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ClaimStatus {
    Pending,
    Voting,
    Approved,
    Rejected,
    Paid,
    Canceled,
    Refunded,
}

impl Claim {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 4 + 64 + 1 + 8 + 8 + 8 + 8 + 8 + 1;
}
