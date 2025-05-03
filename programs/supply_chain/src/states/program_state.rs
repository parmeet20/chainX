use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub owner: Pubkey,
    pub platform_fee: u64,
    pub initialized:bool,
}
