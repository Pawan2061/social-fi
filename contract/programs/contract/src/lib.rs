use anchor_lang::prelude::*;

declare_id!("D5vmmfjdBwwRhpjkXkAMTMEimuNb2PgS2HB3nxbczY4G");
pub mod events;
pub mod instructions;
pub mod state;

#[program]
pub mod contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
