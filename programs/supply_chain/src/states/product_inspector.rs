use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProductInspector {
    pub inspector_id:u64,
    #[max_len(32)]
    pub name: String,
    pub latitude: f64,
    pub longitude: f64,
    pub product_id:u64,
    #[max_len(120)]
    pub inspection_outcome: String,
    #[max_len(512)]
    pub notes: String,
    pub inspection_date:u64,
    pub fee_charge_per_product:u64,
    pub balance:u64,
    pub owner: Pubkey,
}
