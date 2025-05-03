use anchor_lang::prelude::*;

use crate::errors::SupplyChainErrors::*;
use crate::{constants::ANCHOR_DISCRIMINATOR_SIZE, states::user::User};

pub fn create_user(
    ctx: Context<CreateUserInstructionContext>,
    name: String,
    email: String,
    role: String,
) -> Result<()> {
    let user = &mut ctx.accounts.user;
    if name.len() > 32 {
        return Err(InvalidName.into());
    }
    if role.len() > 32 {
        return Err(InvalidRole.into());
    }
    if email.len() > 64 {
        return Err(InvalidEmail.into());
    }
    if user.is_initialized {
        return Err(UserAlreadyInitialized.into());
    }
    if role == "CUSTOMER" {
        user.is_customer = true;
    }

    user.name = name;
    user.email = email;
    user.role = role;
    user.created_at = Clock::get()?.unix_timestamp as u64;
    user.owner = ctx.accounts.owner.key();
    user.factory_count = 0;
    user.transaction_count = 0;
    user.product_count = 0;
    user.warehouse_count = 0;
    user.logistics_count = 0;
    user.inspector_count = 0;
    user.seller_count = 0;
    user.is_initialized = true;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateUserInstructionContext<'info> {
    #[account(
        init,
        payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + User::INIT_SPACE,
        seeds = [b"user",owner.key().as_ref()],
        bump,
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
