use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Product {
    pub product_id: u64,
    #[max_len(32)]
    pub product_name: String,
    #[max_len(512)]
    pub product_description: String,
    #[max_len(32)]
    pub batch_number: String,
    #[max_len(132)]
    pub product_image: String,
    pub factory_id: u64,
    pub factory_pda: Pubkey,
    pub product_price: u64,
    pub product_stock: u64,
    pub raw_material_used: u64,
    pub quality_checked: bool,
    pub inspection_id: u64,
    pub inspector_pda: Pubkey,
    pub inspection_fee_paid: bool,
    pub mrp: u64,
    pub created_at: u64,
}
