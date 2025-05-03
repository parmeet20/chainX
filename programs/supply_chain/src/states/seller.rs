use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Seller {
    pub seller_id: u64,
    #[max_len(32)]
    pub name: String,
    #[max_len(512)]
    pub description: String,
    pub products_count: u64,
    pub latitude: f64,
    pub longitude: f64,
    #[max_len(512)]
    pub contact_info: String,
    pub registered_at: u64,
    pub order_count: u64,
    pub balance: u64,
    pub owner: Pubkey,
}
