use anchor_lang::prelude::*;

use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::errors::SupplyChainErrors;
use crate::states::order::Order;
use crate::states::{
    logistics::Logistics, seller::Seller, seller_product_stock::SellerProductStock, user::User,
};

pub fn receive_product_instruction_as_seller(
    ctx: Context<ReceiveProductAsSellerCtx>,
) -> Result<()> {
    let logistics = &mut ctx.accounts.logistics;
    let user = &mut ctx.accounts.user;
    let seller = &mut ctx.accounts.seller;
    let seller_product_stock = &mut ctx.accounts.seller_product_stock;
    let order = &mut ctx.accounts.order;

    require!(user.role == "SELLER", SupplyChainErrors::UnauthorizedAccess);
    require!(
        user.owner.key() == seller.owner.key(),
        SupplyChainErrors::UnauthorizedAccess
    );

    seller.products_count += 1;
    seller_product_stock.seller_id = seller.seller_id;
    seller_product_stock.stock_quantity = logistics.product_stock;
    seller_product_stock.product_id = logistics.product_id;
    seller_product_stock.created_at = Clock::get()?.unix_timestamp as u64;
    seller_product_stock.seller_pda = seller.key();
    seller_product_stock.product_pda = order.product_pda.key();

    logistics.delivered = true;
    logistics.status = String::from("DELIVERED");
    order.status = String::from("DELIVERED");
    logistics.shipment_ended_at = Clock::get()?.unix_timestamp as u64;
    Ok(())
}

#[derive(Accounts)]
pub struct ReceiveProductAsSellerCtx<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR_SIZE + SellerProductStock::INIT_SPACE,
        seeds = [b"seller_product",seller.key().as_ref(),(seller.products_count+1).to_le_bytes().as_ref()],
        bump
    )]
    pub seller_product_stock: Account<'info, SellerProductStock>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub seller: Account<'info, Seller>,
    #[account(mut)]
    pub order: Account<'info, Order>,
    #[account(mut)]
    pub logistics: Account<'info, Logistics>,
    pub system_program: Program<'info, System>,
}
