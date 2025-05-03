use anchor_lang::prelude::*;

use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::errors::SupplyChainErrors::*;
use crate::states::factory::Factory;
use crate::states::{product::Product, transaction::Transaction, user::User, warehouse::Warehouse};

pub fn buy_product_as_warehouse(
    ctx: Context<BuyProductAsWarehouseCtx>,
    product_id: u64,
    factory_id: u64,
    stock_to_purchase: u64,
) -> Result<()> {
    let transaction = &mut ctx.accounts.transaction;
    let user: &mut Account<'_, User> = &mut ctx.accounts.user;
    let warehouse: &mut Account<'_, Warehouse> = &mut ctx.accounts.warehouse;
    let product: &mut Account<'_, Product> = &mut ctx.accounts.product;
    let factory: &mut Account<'_, Factory> = &mut ctx.accounts.factory;
    let payer = &ctx.accounts.warehouse_owner;
    if user.role != "WAREHOUSE" {
        return Err(UnauthorizedAccess.into());
    }
    if product.product_id != product_id {
        return Err(InvalidProductId.into());
    }
    if factory.factory_id != factory_id {
        return Err(InvalidFactory.into());
    }
    if product.product_stock < stock_to_purchase {
        return Err(InsufficientStock.into());
    }
    if !product.inspection_fee_paid {
        return Err(InvalidProductId.into());
    }

    let total_amount_to_pay = product
        .product_price
        .checked_mul(stock_to_purchase)
        .ok_or(Overflow)?;
    // Missing ownership validation
    if warehouse.owner != ctx.accounts.warehouse_owner.key() {
        return Err(UnauthorizedAccess.into());
    }
    let transaction_instruction = anchor_lang::solana_program::system_instruction::transfer(
        &payer.key(),
        &factory.key(),
        total_amount_to_pay,
    );
    let result = anchor_lang::solana_program::program::invoke(
        &transaction_instruction,
        &[payer.to_account_info(), factory.to_account_info()],
    );
    if let Err(e) = result {
        msg!("Transaction to factory failed: {:?}", e);
        return Err(e.into());
    }
    transaction.transaction_id = user.transaction_count + 1;
    transaction.from = payer.key();
    transaction.to = factory.key();
    transaction.amount = total_amount_to_pay;
    transaction.timestamp = Clock::get()?.unix_timestamp as u64;
    transaction.status = true;

    warehouse.product_count += stock_to_purchase;
    warehouse.product_id = product.product_id;
    product.product_stock -= stock_to_purchase; // Missing

    factory.balance += total_amount_to_pay;

    user.transaction_count += 1;
    Ok(())
}

#[derive(Accounts)]
pub struct BuyProductAsWarehouseCtx<'info> {
    #[account(
        init,
        payer = warehouse_owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + Transaction::INIT_SPACE,
        seeds = [b"transaction",user.key().as_ref(),(user.transaction_count+1).to_le_bytes().as_ref()],
        bump,
    )]
    pub transaction: Account<'info, Transaction>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub warehouse: Account<'info, Warehouse>,
    #[account(mut)]
    pub product: Account<'info, Product>,
    #[account(mut)]
    pub factory: Account<'info, Factory>,
    #[account(mut)]
    pub warehouse_owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
