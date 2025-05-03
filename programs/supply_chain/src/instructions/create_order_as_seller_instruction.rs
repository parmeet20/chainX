use anchor_lang::prelude::*;

use crate::{
    constants::ANCHOR_DISCRIMINATOR_SIZE,
    errors::SupplyChainErrors::*,
    states::{
        order::Order, product::Product, seller::Seller, transaction::Transaction, user::User,
        warehouse::Warehouse,
    },
};

pub fn create_order_instruction_as_seller(
    ctx: Context<CreateOrderAsSellerCtx>,
    warehouse_id: u64,
    product_id: u64,
    product_stock: u64,
) -> Result<()> {
    let warehouse = &mut ctx.accounts.warehouse;
    let user = &mut ctx.accounts.user;
    let seller = &mut ctx.accounts.seller;
    let transaction = &mut ctx.accounts.transaction;
    let order = &mut ctx.accounts.order;
    let product = &mut ctx.accounts.product;
    if user.role != "SELLER" {
        return Err(UnauthorizedAccess.into());
    }
    if ctx.accounts.seller_account.key() != user.owner.key() {
        return Err(UnauthorizedAccess.into());
    }
    if warehouse.warehouse_id != warehouse_id {
        return Err(InvalidWarehouse.into());
    }
    if product.product_id != product_id {
        return Err(InvalidProductId.into());
    }
    if warehouse.product_count < product_stock {
        return Err(InsufficientStock.into());
    }
    let total_amount_to_pay = product
        .product_price
        .checked_mul(product_stock)
        .ok_or(Overflow)?;
    let transaction_instruction = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.seller_account.key(),
        &warehouse.key(),
        total_amount_to_pay,
    );
    let result = anchor_lang::solana_program::program::invoke(
        &transaction_instruction,
        &[
            ctx.accounts.seller_account.to_account_info(),
            warehouse.to_account_info(),
        ],
    );
    if let Err(e) = result {
        msg!("Transaction to warehouse failed: {:?}", e);
        return Err(e.into());
    }

    order.order_id = seller.order_count + 1;
    order.product_id = product_id;
    order.product_stock = product_stock;
    order.warehouse_id = warehouse_id;
    order.total_price = total_amount_to_pay;
    order.timestamp = Clock::get()?.unix_timestamp as u64;
    order.seller_id = seller.seller_id;
    order.status = String::from("ORDERED");

    transaction.transaction_id = user.transaction_count + 1;
    transaction.from = ctx.accounts.seller_account.key();
    transaction.to = warehouse.key();
    transaction.amount = total_amount_to_pay;
    transaction.timestamp = Clock::get()?.unix_timestamp as u64;
    transaction.status = true;

    warehouse.balance += total_amount_to_pay;

    seller.order_count += 1;
    user.transaction_count += 1;
    
    order.warehouse_pda = warehouse.key();
    order.seller_pda = seller.key();
    order.product_pda = product.key();

    Ok(())
}

#[derive(Accounts)]
pub struct CreateOrderAsSellerCtx<'info> {
    #[account(mut)]
    pub seller_account: Signer<'info>,
    #[account(
        init,
        payer = seller_account,
        space = ANCHOR_DISCRIMINATOR_SIZE+Order::INIT_SPACE,
        seeds = [b"order",seller.key().as_ref(),(seller.order_count+1).to_le_bytes().as_ref()],
        bump,
    )]
    pub order: Account<'info, Order>,
    #[account(
        init,
        payer = seller_account,
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
    pub seller: Account<'info, Seller>,
    pub system_program: Program<'info, System>,
}
