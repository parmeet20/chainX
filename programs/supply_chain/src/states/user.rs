use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct User {
    #[max_len(32)]
    pub name: String,
    #[max_len(20)]
    pub role: String,
    #[max_len(64)]
    pub email: String,
    pub created_at: u64,
    pub owner: Pubkey,
    pub factory_count: u64,
    pub transaction_count: u64,
    pub warehouse_count: u64,
    pub logistics_count: u64,
    pub seller_count: u64,
    pub inspector_count: u64,
    pub product_count: u64,
    pub is_customer: bool,
    pub is_initialized: bool,
}
