use crate::events::VoteCast;
use crate::state::{Claim, VoteAccount, VoteChoice};
// use anchor_lang::init_if_needed;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(
        mut,
        has_one = creator_pool,
        constraint = (claim.status == crate::state::ClaimStatus::Voting || claim.status == crate::state::ClaimStatus::Pending) @ ErrorCode::InvalidClaimStatus,
        constraint = Clock::get()?.unix_timestamp < claim.voting_ends_at @ ErrorCode::VotingEnded
    )]
    pub claim: Account<'info, Claim>,

    #[account(mut)]
    pub creator_pool: Account<'info, crate::state::CreatorPool>,

    #[account(
        init_if_needed,
        payer = fan,
        space = VoteAccount::LEN,
        seeds = [b"vote", claim.key().as_ref(), fan.key().as_ref()],
        bump
    )]
    pub vote_account: Account<'info, VoteAccount>,

    #[account(mut)]
    pub fan: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ChangeVote<'info> {
    #[account(
        mut,
        has_one = creator_pool,
        constraint = (claim.status == crate::state::ClaimStatus::Voting || claim.status == crate::state::ClaimStatus::Pending) @ ErrorCode::InvalidClaimStatus,
        constraint = Clock::get()?.unix_timestamp < claim.voting_ends_at @ ErrorCode::VotingEnded
    )]
    pub claim: Account<'info, Claim>,

    #[account(mut)]
    pub creator_pool: Account<'info, crate::state::CreatorPool>,

    #[account(
        mut,
        has_one = voter,
        constraint = vote_account.claim == claim.key() @ ErrorCode::InvalidVoteAccount
    )]
    pub vote_account: Account<'info, VoteAccount>,

    pub voter: Signer<'info>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid claim status for voting")]
    InvalidClaimStatus,
    #[msg("Voting period has ended")]
    VotingEnded,
    #[msg("Invalid vote account")]
    InvalidVoteAccount,
    #[msg("Math overflow")]
    MathOverflow,
}

pub fn vote(ctx: Context<Vote>, choice: VoteChoice) -> Result<()> {
    let claim = &mut ctx.accounts.claim;
    let vote_account = &mut ctx.accounts.vote_account;

    // Check if this is a new vote or changing an existing vote
    let is_new_vote = vote_account.vote_choice.is_none();
    let old_choice = vote_account.vote_choice.clone();

    // Update vote account
    vote_account.claim = claim.key();
    vote_account.voter = ctx.accounts.fan.key();
    vote_account.vote_choice = Some(choice.clone());
    vote_account.voted_at = Clock::get()?.unix_timestamp;
    vote_account.bump = ctx.bumps.vote_account;

    // Update claim vote counts
    if is_new_vote {
        // New vote - add to counts
        match choice {
            VoteChoice::Yes => {
                claim.yes_votes = claim
                    .yes_votes
                    .checked_add(1)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
            VoteChoice::No => {
                claim.no_votes = claim
                    .no_votes
                    .checked_add(1)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
        }
    } else {
        // Changing vote - adjust counts
        if let Some(old_choice) = old_choice {
            match old_choice {
                VoteChoice::Yes => {
                    claim.yes_votes = claim
                        .yes_votes
                        .checked_sub(1)
                        .ok_or(ErrorCode::MathOverflow)?;
                }
                VoteChoice::No => {
                    claim.no_votes = claim
                        .no_votes
                        .checked_sub(1)
                        .ok_or(ErrorCode::MathOverflow)?;
                }
            }
        }

        match choice {
            VoteChoice::Yes => {
                claim.yes_votes = claim
                    .yes_votes
                    .checked_add(1)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
            VoteChoice::No => {
                claim.no_votes = claim
                    .no_votes
                    .checked_add(1)
                    .ok_or(ErrorCode::MathOverflow)?;
            }
        }
    }

    // Emit event
    emit!(VoteCast {
        claim: claim.key(),
        voter: ctx.accounts.fan.key(),
        vote_choice: match choice {
            VoteChoice::Yes => true,
            VoteChoice::No => false,
        },
        voted_at: vote_account.voted_at,
    });

    Ok(())
}

pub fn change_vote(ctx: Context<ChangeVote>, new_choice: VoteChoice) -> Result<()> {
    let claim = &mut ctx.accounts.claim;
    let vote_account = &mut ctx.accounts.vote_account;

    // Get the old choice
    let old_choice = vote_account
        .vote_choice
        .clone()
        .ok_or(ErrorCode::InvalidVoteAccount)?;

    // Update vote account
    vote_account.vote_choice = Some(new_choice.clone());
    vote_account.voted_at = Clock::get()?.unix_timestamp;

    // Adjust claim vote counts
    match old_choice {
        VoteChoice::Yes => {
            claim.yes_votes = claim
                .yes_votes
                .checked_sub(1)
                .ok_or(ErrorCode::MathOverflow)?;
        }
        VoteChoice::No => {
            claim.no_votes = claim
                .no_votes
                .checked_sub(1)
                .ok_or(ErrorCode::MathOverflow)?;
        }
    }

    match new_choice {
        VoteChoice::Yes => {
            claim.yes_votes = claim
                .yes_votes
                .checked_add(1)
                .ok_or(ErrorCode::MathOverflow)?;
        }
        VoteChoice::No => {
            claim.no_votes = claim
                .no_votes
                .checked_add(1)
                .ok_or(ErrorCode::MathOverflow)?;
        }
    }

    // Emit event
    emit!(VoteCast {
        claim: claim.key(),
        voter: ctx.accounts.voter.key(),
        vote_choice: match new_choice {
            VoteChoice::Yes => true,
            VoteChoice::No => false,
        },
        voted_at: vote_account.voted_at,
    });

    Ok(())
}
