use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Order{
    pub order_id: u64,
    pub product_id: u64,
    pub product_pda: Pubkey,
    pub product_stock: u64,
    pub warehouse_id: u64,
    pub warehouse_pda: Pubkey,
    pub total_price: u64,
    pub timestamp: u64,
    pub seller_id: u64,
    pub seller_pda: Pubkey,
    pub logistic_id: u64,
    pub logistic_pda: Pubkey,
    #[max_len(32)]
    pub status: String,
}