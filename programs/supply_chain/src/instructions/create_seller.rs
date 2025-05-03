use anchor_lang::prelude::*;

use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::states::seller::Seller;
use crate::states::user::User;
use crate::errors::SupplyChainErrors::*;

pub fn create_seller_instruction(
    ctx: Context<CreateSellerCtx>,
    name: String,
    description: String,
    latitude: f64,
    longitude: f64,
    contact_info: String,
) -> Result<()> {    
    let seller = &mut ctx.accounts.seller;
    let user = &mut ctx.accounts.user;
    if user.role!="SELLER"{
        return Err(UnauthorizedAccess.into());
    }
    if name.len()>32{
        return Err(InvalidName.into());
    }
    if description.len()>512{
        return Err(InvalidDescription.into());
    }
    if contact_info.len()>512{
        return Err(InvalidContactInfo.into());
    }
    seller.seller_id = user.seller_count+1;
    seller.name = name;
    seller.description = description;
    seller.latitude = latitude;
    seller.longitude = longitude;
    seller.contact_info = contact_info;
    seller.registered_at = Clock::get()?.unix_timestamp as u64;
    seller.products_count = 0;
    seller.owner = ctx.accounts.owner.key();
    seller.order_count = 0;
    seller.balance = 0;
    user.seller_count+=1;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateSellerCtx<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        space = ANCHOR_DISCRIMINATOR_SIZE + Seller::INIT_SPACE,
        payer = owner,
        seeds = [b"seller",user.key().as_ref(),(user.seller_count+1).to_le_bytes().as_ref()],
        bump, 
    )]
    pub seller: Account<'info, Seller>,
    #[account(mut)]
    pub user: Account<'info, User>,
    pub system_program: Program<'info, System>,
}
