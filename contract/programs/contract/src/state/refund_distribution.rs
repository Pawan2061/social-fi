use anchor_lang::prelude::*;

#[account]
pub struct RefundDistribution {
    /// The claim this refund is for
    pub claim: Pubkey,

    /// The NFT holder who gets the refund
    pub nft_holder: Pubkey,

    /// The NFT mint address
    pub nft_mint: Pubkey,

    /// Amount of USDC to refund to this holder
    pub refund_amount: u64,

    /// Whether the refund has been claimed
    pub is_claimed: bool,

    /// When the refund was calculated
    pub calculated_at: i64,

    /// Bump seed for PDA
    pub bump: u8,
}

impl RefundDistribution {
    pub const LEN: usize = 8 + // discriminator
        32 + // claim
        32 + // nft_holder
        32 + // nft_mint
        8 +  // refund_amount
        1 +  // is_claimed
        8 +  // calculated_at
        1; // bump
}
