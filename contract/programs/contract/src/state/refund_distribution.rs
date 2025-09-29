use anchor_lang::prelude::*;

#[account]
pub struct RefundDistribution {
    pub claim: Pubkey,

    pub nft_holder: Pubkey,

    pub nft_mint: Pubkey,

    pub refund_amount: u64,

    pub is_claimed: bool,

    pub calculated_at: i64,

    pub bump: u8,
}

impl RefundDistribution {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 1 + 8 + 1;
}
