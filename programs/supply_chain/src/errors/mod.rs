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
    #[msg("description too long")]
    InvalidDescription,
    #[msg("contact info too long")]
    InvalidContactInfo,
    #[msg("invalid factory")]
    InvalidFactory,
    #[msg("invalid product id")]
    InvalidProductId,
    #[msg("quality already checked")]
    QualityChecked,
    #[msg("inspection outcome too long")]
    InvalidInspectionOutcome,
    #[msg("notes too long")]
    InvalidNotes,
    #[msg("overflow")]
    Overflow,
    #[msg("invalid inspector")]
    InvalidInspectorId,
    #[msg("product not quality checked")]
    ProductNotQualityChecked,
    #[msg("insufficient balance")]
    InsufficientBalance,
    #[msg("should withdraw atleast 1 SOL")]
    InsifficentWithdraw,
    #[msg("insufficient stock")]
    InsufficientStock,
}
