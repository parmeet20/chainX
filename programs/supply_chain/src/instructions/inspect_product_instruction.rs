use anchor_lang::prelude::*;

use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::errors::SupplyChainErrors::*;
use crate::states::factory::Factory;
use crate::states::{product::Product, product_inspector::ProductInspector, user::User};

pub fn inspect_product_instruction(
    ctx: Context<InspectProductContext>,
    name: String,
    latitude: f64,
    longitude: f64,
    product_id: u64,
    inspection_outcome: String,
    notes: String,
    fee_charge_per_product: u64,
) -> Result<()> {
    let user = &mut ctx.accounts.user;
    let inspector = &mut ctx.accounts.inspection_details;
    let product = &mut ctx.accounts.product;
    let factory = &mut ctx.accounts.factory;
    if user.role != "INSPECTOR" {
        return Err(UnauthorizedAccess.into());
    }
    if factory.factory_id != product.factory_id {
        return Err(InvalidFactory.into());
    }
    if product_id != product.product_id {
        return Err(InvalidProductId.into());
    }
    if name.len() > 32 {
        return Err(InvalidName.into());
    }
    if product.quality_checked {
        return Err(QualityChecked.into());
    }
    if inspection_outcome.len() > 120 {
        return Err(InvalidInspectionOutcome.into());
    }
    if notes.len() > 512 {
        return Err(InvalidNotes.into());
    }
    inspector.inspector_id = user.inspector_count + 1;
    inspector.name = name;
    inspector.latitude = latitude;
    inspector.longitude = longitude;
    inspector.product_id = product_id;
    inspector.inspection_outcome = inspection_outcome;
    inspector.notes = notes;
    inspector.inspection_date = Clock::get()?.unix_timestamp as u64;
    inspector.fee_charge_per_product = fee_charge_per_product;
    inspector.owner = ctx.accounts.owner.key();
    inspector.balance = 0;
    user.inspector_count += 1;

    product.inspection_id = inspector.inspector_id;
    product.quality_checked = true;
    product.inspector_pda = inspector.key();
    Ok(())
}

#[derive(Accounts)]
pub struct InspectProductContext<'info> {
    #[account(
        init,
        payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE+ProductInspector::INIT_SPACE,
        seeds = [b"product_inspector",user.key().as_ref(),(user.inspector_count+1).to_le_bytes().as_ref()],
        bump,
    )]
    pub inspection_details: Account<'info, ProductInspector>,
    #[account(mut)]
    pub product: Account<'info, Product>,
    #[account(mut)]
    pub factory: Account<'info, Factory>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
