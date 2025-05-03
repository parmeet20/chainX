use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::errors::SupplyChainErrors::*;
use crate::states::factory::Factory;
use crate::states::product::Product;
use crate::states::{user::User, warehouse::Warehouse};
use anchor_lang::prelude::*;
use anchor_lang::{
    account,
    prelude::Account,
    prelude::{Program, System},
};

pub fn create_warehouse_instrution(
    ctx: Context<CreateWarehouseCtx>,
    name: String,
    description: String,
    contact_deatails: String,
    factory_id: u64,
    warehouse_size: u64,
    latitude: f64,
    longitude: f64,
) -> Result<()> {
    let warehouse = &mut ctx.accounts.warehouse;
    let user = &mut ctx.accounts.user;
    let factory = &mut ctx.accounts.factory;
    let product = &mut ctx.accounts.product;
    if user.role != "WAREHOUSE" {
        return Err(UnauthorizedAccess.into());
    }
    if factory.factory_id != factory_id {
        return Err(InvalidFactory.into());
    }
    warehouse.warehouse_id = user.warehouse_count + 1;
    warehouse.name = name;
    warehouse.description = description;
    warehouse.latitude = latitude;
    warehouse.longitude = longitude;
    warehouse.balance = 0;
    warehouse.owner = ctx.accounts.owner.key();
    warehouse.contact_details = contact_deatails;
    warehouse.logistic_count = 0;
    warehouse.factory_id = factory_id;
    warehouse.created_at = Clock::get()?.unix_timestamp as u64;
    warehouse.product_count = 0;
    warehouse.warehouse_size = warehouse_size;
    warehouse.product_pda = product.key();
    warehouse.product_id = product.product_id;

    user.warehouse_count += 1;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateWarehouseCtx<'info> {
    #[account(
        init,
        payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + Warehouse::INIT_SPACE,
        seeds = [b"warehouse", user.key().as_ref(), (user.warehouse_count + 1).to_le_bytes().as_ref()],
        bump,
    )]
    pub warehouse: Account<'info, Warehouse>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub product: Account<'info, Product>,
    #[account(mut)]
    pub factory: Account<'info, Factory>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
