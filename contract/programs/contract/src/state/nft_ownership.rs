use anchor_lang::prelude::*;

#[account]
pub struct NftOwnership {
    pub owner: Pubkey,

    pub nft_mint: Pubkey,

    pub creator_collection: Pubkey,

    pub creator: Pubkey,

    pub registered_at: i64,

    pub bump: u8,
}

impl NftOwnership {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 8 + 1;
}
