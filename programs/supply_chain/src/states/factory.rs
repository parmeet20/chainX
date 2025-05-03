use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Factory {
    pub factory_id: u64,
    #[max_len(32)]
    pub name: String,
    #[max_len(512)]
    pub description: String,
    pub owner: Pubkey,
    pub created_at: u64,
    pub latitude: f64,
    pub longitude: f64,
    #[max_len(100)]
    pub contact_info: String,
    pub product_count: u64,
    pub balance: u64,
}
