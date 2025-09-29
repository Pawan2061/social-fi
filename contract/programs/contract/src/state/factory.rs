use anchor_lang::prelude::*;

#[account]
pub struct Factory {
    pub authority: Pubkey,

    pub default_quorum: u64,

    pub default_voting_window: i64,

    pub platform_fee_percentage: u64,

    pub usdc_mint: Pubkey,

    pub bump: u8,
}

impl Factory {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 32 + 1;
}
