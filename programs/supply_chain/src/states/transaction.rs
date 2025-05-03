use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Transaction{
    pub transaction_id:u64,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount:u64,
    pub timestamp:u64,
    pub status:bool,
}