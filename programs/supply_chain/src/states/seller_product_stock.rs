use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct SellerProductStock {
    pub seller_id: u64,       // Links to the seller
    pub seller_pda: Pubkey,   // Links to the seller
    pub product_id: u64,      // Links to the product
    pub product_pda: Pubkey, // Links to the product
    pub stock_quantity: u64,  // Stock this seller has for this product
    #[max_len(32)]
    pub stock_price: u64, // Price this seller is offering (can differ from product base price)
    pub created_at: u64,      // When this stock was added
}
