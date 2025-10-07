use anchor_lang::prelude::*;

#[account]
pub struct CreatorPool {
    pub creator: Pubkey,

    pub usdc_mint: Pubkey,

    pub usdc_vault: Pubkey,

    pub total_deposited: u64,

    pub total_withdrawn: u64,

    pub voting_quorum: u64,

    pub voting_window: i64,

    pub status: PoolStatus,

    pub claim_count: u64,

    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PoolStatus {
    Active,
    Paused,
    Closed,
}

impl CreatorPool {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 8 + 1;
}
