use anchor_lang::prelude::*;

use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::errors::SupplyChainErrors;
use crate::states::program_state::ProgramState;

pub fn initialize_program_state(
    ctx: Context<InitializeProgramCtx>
) -> Result<()> {
    let program_state = &mut ctx.accounts.program_state;
    require!(
        !program_state.initialized,
        SupplyChainErrors::ProgramAlreadyInitialized
    );

    program_state.owner = ctx.accounts.owner.key();
    program_state.platform_fee = 2;
    program_state.initialized = true;
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeProgramCtx<'info> {
    #[account(
        init,
        payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + ProgramState::INIT_SPACE,
        seeds = [b"program_state"],
        bump,
    )]
    pub program_state: Account<'info, ProgramState>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
