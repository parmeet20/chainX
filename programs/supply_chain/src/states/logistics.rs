use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Logistics {
    pub logistic_id: u64,
    #[max_len(32)]
    pub name: String,
    #[max_len(32)]
    pub transportation_mode: String,
    #[max_len(126)]
    pub contact_info: String,
    #[max_len(32)]
    pub status: String,
    pub shipment_cost: u64,
    pub product_id: u64,
    pub product_pda: u64,
    pub product_stock: u64,
    pub delivery_confirmed: bool,
    pub balance: u64,
    pub warehouse_id: u64,
    pub shipment_started_at: u64,
    pub shipment_ended_at: u64,
    pub delivered: bool,
    pub latitude: f64,
    pub longitude: f64,
    pub owner: Pubkey,
}
