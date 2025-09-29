use anchor_lang::prelude::*;

#[account]
pub struct VoteAccount {
    pub claim: Pubkey,

    pub voter: Pubkey,

    pub vote_choice: bool,

    pub voted_at: i64,

    pub bump: u8,
}

impl VoteAccount {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8 + 1;
}
