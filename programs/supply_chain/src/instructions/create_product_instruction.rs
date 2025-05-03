use anchor_lang::prelude::*;

use crate::{
    constants::ANCHOR_DISCRIMINATOR_SIZE,
    states::{factory::Factory, product::Product},
};

pub fn create_product(
    ctx: Context<CreateProductInstructionContext>,
    product_name: String,
    product_description: String,
    product_image: String,
    batch_number: String,
    product_price: u64,
    raw_material_used: u64,
    product_stock: u64,
    mrp: u64,
) -> Result<()> {
    let product = &mut ctx.accounts.product;
    let factory = &mut ctx.accounts.factory;
    product.product_id = factory.product_count + 1;
    product.factory_id = factory.factory_id;
    product.product_name = product_name;
    product.product_description = product_description;
    product.batch_number = batch_number;
    product.product_price = product_price;
    product.product_image = product_image;
    product.product_stock = product_stock;
    product.factory_pda = factory.key();
    product.mrp = mrp;
    product.raw_material_used = raw_material_used;
    product.quality_checked = false;
    product.inspection_id = 0;
    product.created_at = Clock::get()?.unix_timestamp as u64;
    factory.product_count += 1;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateProductInstructionContext<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(init,
        payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + Product::INIT_SPACE,
        seeds = [b"product", factory.key().as_ref(),(factory.product_count+1).to_le_bytes().as_ref()],
        bump
    )]
    pub product: Account<'info, Product>,
    #[account(mut)]
    pub factory: Account<'info, Factory>,
    pub system_program: Program<'info, System>,
}
