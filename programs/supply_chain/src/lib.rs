use anchor_lang::prelude::*;

mod constants;
mod errors;
mod states;
mod instructions;

use crate::instructions::*;

declare_id!("BvjL3nMVHZowbJdYAyan4Xn6MXunbBAYQC9tXN2EAQZf");

#[program]
pub mod supply_chain {
    use super::*;

    pub fn initialize_program_state(ctx: Context<InitializeProgramCtx>) -> Result<()> {
        instructions::initialize_program_state(ctx)
    }

    pub fn update_platform_fee(ctx: Context<UpdatePlatformFeeCtx>, fee: u64) -> Result<()> {
        instructions::update_platform_fee(ctx, fee)
    }

    pub fn create_user(
        ctx: Context<CreateUserInstructionContext>,
        name: String,
        email: String,
        role: String,
    ) -> Result<()> {
        instructions::create_user(ctx, name, email, role)
    }

}