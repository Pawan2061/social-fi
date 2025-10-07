use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteChoice {
    Yes,
    No,
}

#[account]
pub struct VoteAccount {
    pub claim: Pubkey,

    pub voter: Pubkey,

    pub vote_choice: Option<VoteChoice>,

    pub voted_at: i64,

    pub bump: u8,
}

impl VoteAccount {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 1 + 8 + 1;
}
