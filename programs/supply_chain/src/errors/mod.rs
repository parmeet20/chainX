use anchor_lang::prelude::*;

#[error_code]
pub enum SupplyChainErrors {
    #[msg("unauthorized access")]
    UnauthorizedAccess,
}
