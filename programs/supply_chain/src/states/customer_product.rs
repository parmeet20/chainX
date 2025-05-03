use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CustomerProduct {
    pub product_id: u64,
    pub product_pda: Pubkey,
    pub seller_pda: Pubkey,
    pub owner: Pubkey,
    pub stock_quantity: u64,
    pub purchased_on: u64,
}
