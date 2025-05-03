use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Warehouse {
    pub warehouse_id: u64,
    pub factory_id: u64,
    pub created_at: u64,
    #[max_len(32)]
    pub name: String,
    #[max_len(512)]
    pub description: String,
    pub product_id: u64,
    pub product_pda: Pubkey,
    pub product_count: u64,
    pub latitude: f64,
    pub longitude: f64,
    pub balance: u64,
    #[max_len(128)]
    pub contact_details: String,
    pub owner: Pubkey,
    pub warehouse_size: u64,
    pub logistic_count: u64,
}
