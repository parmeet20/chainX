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
        instructions::inspect_product_instruction(
            ctx,
            name,
            latitude,
            longitude,
            product_id,
            inspection_outcome,
            notes,
            fee_charge_per_product,
        )
    }

    pub fn pay_product_inspector_instruction(
        ctx: Context<PayProductInspectorInstruction>,
        inspector_id: u64,
        product_id: u64,
    ) -> Result<()> {
        instructions::pay_product_inspector_instruction(ctx, inspector_id, product_id)
    }

    pub fn withdraw_inspector_balance(
        ctx: Context<WithdrawInspectorBalanceCtx>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_inspector_balance(ctx, amount)
    }

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
        instructions::create_warehouse_instrution(
            ctx,
            name,
            description,
            contact_deatails,
            factory_id,
            warehouse_size,
            latitude,
            longitude,
        )
    }

    pub fn withdraw_balance_as_factory(
        ctx: Context<WithdrawBalanceAsFactoryCtx>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_balance_as_factory(ctx, amount)
    }

    pub fn buy_product_as_warehouse(
        ctx: Context<BuyProductAsWarehouseCtx>,
        product_id: u64,
        factory_id: u64,
        stock_to_purchase: u64,
    ) -> Result<()> {
        instructions::buy_product_as_warehouse(ctx, product_id, factory_id, stock_to_purchase)
    }

    pub fn create_seller_instruction(
        ctx: Context<CreateSellerCtx>,
        name: String,
        description: String,
        latitude: f64,
        longitude: f64,
        contact_info: String,
    ) -> Result<()> {
        instructions::create_seller_instruction(
            ctx,
            name,
            description,
            latitude,
            longitude,
            contact_info,
        )
    }
    pub fn withdraw_balance_as_warehouse_instruction(
        ctx: Context<WithdrawBalanceAsWarehouseCtx>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_balance_as_warehouse_instruction(ctx, amount)
    }
}
