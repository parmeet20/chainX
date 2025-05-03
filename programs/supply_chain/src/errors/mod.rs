use anchor_lang::prelude::*;

#[error_code]
pub enum SupplyChainErrors {
    #[msg("unauthorized access")]
    UnauthorizedAccess,
    #[msg("program already initialized")]
    ProgramAlreadyInitialized,
    #[msg("user already initialized")]
    UserAlreadyInitialized,
    #[msg("name too long")]
    InvalidName,
    #[msg("invalid role")]
    InvalidRole,
    #[msg("invalid email")]
    InvalidEmail,
    #[msg("Can not set platform fee more than 5%")]
    InvalidPlatformFee,
}
