use anchor_lang::prelude::*;

use crate::{errors::SupplyChainErrors, states::program_state::ProgramState};

pub fn update_platform_fee(ctx: Context<UpdatePlatformFeeCtx>, fee: u64) -> Result<()> {
    let state = &mut ctx.accounts.program_state;
    require!(
        state.owner.key() == ctx.accounts.owner.key(),
        SupplyChainErrors::UnauthorizedAccess
    );
    require!(fee <= 5, SupplyChainErrors::InvalidPlatformFee);
    state.platform_fee = fee;
    Ok(())
}

#[derive(Accounts)]
pub struct UpdatePlatformFeeCtx<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, seeds = [b"program_state"], bump)]
    pub program_state: Account<'info, ProgramState>,
    pub system_program: Program<'info, System>,
}
