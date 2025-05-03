use anchor_lang::prelude::*;

use crate::{
    constants::ANCHOR_DISCRIMINATOR_SIZE,
    errors::SupplyChainErrors,
    states::{
        logistics::Logistics, order::Order, product::Product, transaction::Transaction, user::User,
        warehouse::Warehouse,
    },
};

pub fn send_logistics_to_seller_instruction(
    ctx: Context<SendLogisticsToSellerCtx>,
    logistics_id: u64,
    product_id: u64,
    warehouse_id: u64,
    shipping_cost: u64,
) -> Result<()> {
    let logistics = &mut ctx.accounts.logistics;
    let user = &mut ctx.accounts.user;
    let transaction = &mut ctx.accounts.transaction;
    let warehouse = &mut ctx.accounts.warehouse;
    let product = &mut ctx.accounts.product;
    let order = &mut ctx.accounts.order;

    require!(
        product_id == product.product_id,
        SupplyChainErrors::InvalidProductId
    );
    require!(
        warehouse_id == warehouse.warehouse_id,
        SupplyChainErrors::InvalidWarehouse
    );
    require!(
        logistics_id == logistics.logistic_id,
        SupplyChainErrors::InvalidLogistics
    );
    require!(
        user.role == "WAREHOUSE",
        SupplyChainErrors::UnauthorizedAccess
    );
    require!(
        order.warehouse_id == warehouse.warehouse_id,
        SupplyChainErrors::InvalidWarehouse
    );
    require!(
        order.product_id == warehouse.product_id,
        SupplyChainErrors::InvalidProductId
    );
    let total_amount_to_pay = shipping_cost;
    let transaction_instruction = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.signer.key(),
        &logistics.key(),
        total_amount_to_pay,
    );
    let result = anchor_lang::solana_program::program::invoke(
        &transaction_instruction,
        &[
            ctx.accounts.signer.to_account_info(),
            logistics.to_account_info(),
        ],
    );
    if let Err(e) = result {
        msg!("Transaction to logistics failed: {:?}", e);
        return Err(e.into());
    }
    transaction.transaction_id = user.transaction_count + 1;
    transaction.from = ctx.accounts.signer.key();
    transaction.to = logistics.key();
    transaction.amount = total_amount_to_pay;
    transaction.timestamp = Clock::get()?.unix_timestamp as u64;
    transaction.status = true;

    logistics.shipment_started_at = Clock::get()?.unix_timestamp as u64;
    logistics.product_stock = order.product_stock;
    logistics.status = String::from("ON THE WAY");
    logistics.balance += total_amount_to_pay;

    warehouse.logistic_count += 1;
    warehouse.product_count -= order.product_stock;

    order.logistic_id = logistics.logistic_id;
    order.product_pda = product.key();
    order.logistic_pda = logistics.key();

    user.transaction_count += 1;
    Ok(())
}

#[derive(Accounts)]
pub struct SendLogisticsToSellerCtx<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub logistics: Account<'info, Logistics>,
    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR_SIZE+Transaction::INIT_SPACE,
        seeds = [b"transaction",user.key().as_ref(),(user.transaction_count+1).to_le_bytes().as_ref()],
        bump,
    )]
    pub transaction: Account<'info, Transaction>,
    #[account(mut)]
    pub warehouse: Account<'info, Warehouse>,
    #[account(mut)]
    pub product: Account<'info, Product>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub order: Account<'info, Order>,
    pub system_program: Program<'info, System>,
}
