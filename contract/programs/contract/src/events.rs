use anchor_lang::prelude::*;

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
    pub pool_amount: u64,
    pub evidence_ipfs_hash: String,
}

#[event]
pub struct VoteCast {
    pub claim: Pubkey,
    pub voter: Pubkey,
    pub vote_choice: bool,
}

#[event]
pub struct ClaimFinalized {
    pub claim: Pubkey,
    pub status: String, // "Approved" or "Rejected"
    pub yes_votes: u64,
    pub no_votes: u64,
}

#[event]
pub struct ClaimPaid {
    pub claim: Pubkey,
    pub creator: Pubkey,
    pub amount_paid: u64,
}

#[event]
pub struct RefundDistributed {
    pub claim: Pubkey,
    pub nft_holder: Pubkey,
    pub nft_mint: Pubkey,
    pub refund_amount: u64,
}

#[event]
pub struct NftOwnershipVerified {
    pub voter: Pubkey,
    pub nft_mint: Pubkey,
    pub creator: Pubkey,
}
