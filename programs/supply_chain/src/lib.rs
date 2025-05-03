use anchor_lang::prelude::*;

mod constants;
mod errors;
mod instructions;
mod states;

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

    pub fn create_factory(
        ctx: Context<CreateFactoryInstructionContext>,
        name: String,
        description: String,
        latitude: f64,
        longitude: f64,
        contact_info: String,
    ) -> Result<()> {
        instructions::create_factory(ctx, name, description, latitude, longitude, contact_info)
    }

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
        instructions::create_product(
            ctx,
            product_name,
            product_description,
            product_image,
            batch_number,
            product_price,
            raw_material_used,
            product_stock,
            mrp,
        )
    }
}
