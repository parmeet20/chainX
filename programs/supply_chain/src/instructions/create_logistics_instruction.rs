use anchor_lang::prelude::*;

use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::errors::SupplyChainErrors;
use crate::states::product::Product;
use crate::states::warehouse::Warehouse;
use crate::states::{logistics::Logistics, user::User};

pub fn create_logistics_instruction(
    ctx: Context<CreateLogisticsContext>,
    name: String,
    transportation_mode: String,
    contact_info: String,
    product_id: u64,
    warehouse_id: u64,
    latitude: f64,
    longitude: f64,
) -> Result<()> {
    let user = &mut ctx.accounts.user;
    let logistics = &mut ctx.accounts.logistics;
    let warehouse = &mut ctx.accounts.warehouse;
    let product = &mut ctx.accounts.product;

    require!(
        user.owner.key() == ctx.accounts.owner.key(),
        SupplyChainErrors::UnauthorizedAccess
    );
    require!(
        user.role == "LOGISTICS",
        SupplyChainErrors::UnauthorizedAccess
    );
    require!(name.len() < 32, SupplyChainErrors::InvalidName);
    require!(
        contact_info.len() < 512,
        SupplyChainErrors::InvalidContactInfo
    );
    require!(
        transportation_mode.len() < 32,
        SupplyChainErrors::InvalidName
    );
    require!(
        warehouse_id == warehouse.warehouse_id,
        SupplyChainErrors::InvalidWarehouse
    );
    require!(
        product_id == product.product_id && product_id == warehouse.product_id,
        SupplyChainErrors::InvalidProductId
    );
    logistics.logistic_id = user.logistics_count + 1;
    logistics.name = name;
    logistics.transportation_mode = transportation_mode;
    logistics.contact_info = contact_info;
    logistics.product_id = product_id;
    logistics.delivery_confirmed = false;
    logistics.product_stock = 0;
    logistics.latitude = latitude;
    logistics.longitude = longitude;
    user.logistics_count += 1;
    logistics.balance = 0;
    logistics.warehouse_id = warehouse_id;
    logistics.owner = ctx.accounts.owner.key();
    Ok(())
}

#[derive(Accounts)]
pub struct CreateLogisticsContext<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + Logistics::INIT_SPACE,
        seeds = [b"logistics",user.key().as_ref(),(user.logistics_count+1).to_le_bytes().as_ref()],
        bump,
    )]
    pub logistics: Account<'info, Logistics>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub warehouse: Account<'info, Warehouse>,
    #[account(mut)]
    pub product: Account<'info, Product>,
    pub system_program: Program<'info, System>,
}
