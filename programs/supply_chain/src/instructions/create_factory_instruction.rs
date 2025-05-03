use anchor_lang::prelude::*;

use crate::{
    constants::ANCHOR_DISCRIMINATOR_SIZE,
    errors::SupplyChainErrors::*,
    states::{factory::Factory, user::User},
};

pub fn create_factory(
    ctx: Context<CreateFactoryInstructionContext>,
    name: String,
    description: String,
    latitude: f64,
    longitude: f64,
    contact_info: String,
) -> Result<()> {
    let factory = &mut ctx.accounts.factory;
    let user = &mut ctx.accounts.user;
    if user.role != "FACTORY" {
        return Err(UnauthorizedAccess.into());
    }
    if name.len() > 32 {
        return Err(InvalidName.into());
    }
    if description.len() > 512 {
        return Err(InvalidDescription.into());
    }
    if contact_info.len() > 512 {
        return Err(InvalidContactInfo.into());
    }
    user.factory_count += 1;
    factory.factory_id = ctx.accounts.user.factory_count;
    factory.name = name;
    factory.description = description;
    factory.latitude = latitude;
    factory.longitude = longitude;
    factory.contact_info = contact_info;
    factory.product_count = 0;
    factory.balance = 0;
    factory.owner = ctx.accounts.owner.key();
    factory.created_at = Clock::get()?.unix_timestamp as u64;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateFactoryInstructionContext<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(init,
         payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + Factory::INIT_SPACE,
        seeds = [b"factory", user.key().as_ref(),(user.factory_count+1).to_le_bytes().as_ref()],
        bump
    )]
    pub factory: Account<'info, Factory>,
    #[account(mut)]
    pub user: Account<'info, User>,
    pub system_program: Program<'info, System>,
}
