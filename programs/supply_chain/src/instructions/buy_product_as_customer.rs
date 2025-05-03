use anchor_lang::prelude::*;

use crate::{
    constants::ANCHOR_DISCRIMINATOR_SIZE,
    errors::SupplyChainErrors,
    states::{
        customer_product::CustomerProduct, product::Product, seller::Seller,
        seller_product_stock::SellerProductStock, transaction::Transaction, user::User,
    },
};

pub fn buy_product_as_customer_ctx(
    ctx: Context<BuyProductAsCustomerCtx>,
    stock: u64,
) -> Result<()> {
    let user = &mut ctx.accounts.user;
    let seller = &mut ctx.accounts.seller;
    let seller_product = &mut ctx.accounts.seller_product;
    let customer_product = &mut ctx.accounts.customer_product;
    let transaction = &mut ctx.accounts.transaction;
    let product = &mut ctx.accounts.product;

    require!(
        user.role == "CUSTOMER" || user.is_customer,
        SupplyChainErrors::UnauthorizedAccess
    );
    require!(
        stock <= seller_product.stock_quantity,
        SupplyChainErrors::InsufficientStock
    );
    let total_amount_to_pay = product
        .mrp
        .checked_mul(stock)
        .ok_or(SupplyChainErrors::Overflow)?;
    let transaction_instruction = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.buyer.key(),
        &seller.key(),
        total_amount_to_pay,
    );
    let result = anchor_lang::solana_program::program::invoke(
        &transaction_instruction,
        &[
            ctx.accounts.buyer.to_account_info(),
            seller.to_account_info(),
        ],
    );
    if let Err(e) = result {
        msg!("Transaction to seller failed: {:?}", e);
        return Err(e.into());
    }

    transaction.transaction_id = user.transaction_count + 1;
    transaction.from = ctx.accounts.buyer.key();
    transaction.to = seller.key();
    transaction.amount = total_amount_to_pay;
    transaction.timestamp = Clock::get()?.unix_timestamp as u64;
    transaction.status = true;

    customer_product.product_id = product.product_id;
    customer_product.stock_quantity = customer_product
        .stock_quantity
        .checked_add(stock)
        .ok_or(SupplyChainErrors::Overflow)?;
    customer_product.product_pda = product.key();
    customer_product.owner = ctx.accounts.buyer.key();
    customer_product.seller_pda = seller.key();
    customer_product.purchased_on = Clock::get()?.unix_timestamp as u64;

    seller.balance = total_amount_to_pay;
    seller_product.stock_quantity = seller_product
        .stock_quantity
        .checked_sub(stock)
        .ok_or(SupplyChainErrors::Overflow)?;

    user.transaction_count += 1;
    user.product_count += 1;

    Ok(())
}

#[derive(Accounts)]
pub struct BuyProductAsCustomerCtx<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        init,
        payer = buyer,
        space = ANCHOR_DISCRIMINATOR_SIZE + CustomerProduct::INIT_SPACE,
        seeds = [b"customer_product",user.key().as_ref(),(user.product_count+1).to_le_bytes().as_ref()],
        bump,
    )]
    pub customer_product: Account<'info, CustomerProduct>,
    #[account(
        init,
        payer = buyer,
        space = ANCHOR_DISCRIMINATOR_SIZE + Transaction::INIT_SPACE,
        seeds = [b"transaction",user.key().as_ref(),(user.transaction_count+1).to_le_bytes().as_ref()],
        bump,
    )]
    pub transaction: Account<'info, Transaction>,
    #[account(mut)]
    pub seller_product: Account<'info, SellerProductStock>,
    #[account(mut)]
    pub seller: Account<'info, Seller>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(
        address = seller_product.product_pda,
    )]
    pub product: Account<'info, Product>,
    pub system_program: Program<'info, System>,
}
