use anchor_lang::prelude::*;

#[account]
pub struct CreatorCollection {
    pub creator: Pubkey,

    pub collection_mint: Pubkey,

    pub collection_metadata: Pubkey,

    pub collection_master_edition: Pubkey,

    pub total_supply: u64,

    pub created_at: i64,

    pub bump: u8,
}

impl CreatorCollection {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 1;
}
