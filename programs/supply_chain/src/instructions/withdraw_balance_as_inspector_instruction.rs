use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::errors::SupplyChainErrors;
use crate::states::{
    product_inspector::ProductInspector, program_state::ProgramState, transaction::Transaction,
    user::User,
};
use anchor_lang::prelude::*;

pub fn withdraw_inspector_balance(
    ctx: Context<WithdrawInspectorBalanceCtx>,
    amount: u64,
) -> Result<()> {
    let transaction = &mut ctx.accounts.transaction;
    let inspector = &mut ctx.accounts.inspector;
    let user = &mut ctx.accounts.user;
    let programs_state = &ctx.accounts.programs_state;
    let platform_address = &ctx.accounts.platform_address;
    let payer = ctx.accounts.payer.key();

    // Authorization check
    // Ensure the payer is the owner of the user account and the user has the "INSPECTOR" role
    require!(
        user.owner == payer && user.role == "INSPECTOR",
        SupplyChainErrors::UnauthorizedAccess
    );

    require!(
        amount >= 1_000_000_000,
        SupplyChainErrors::InsifficentWithdraw
    );

    // Check sufficient balance in inspector account
    require!(
        inspector.balance >= amount,
        SupplyChainErrors::InsufficientBalance
    );

    // Ensure withdrawal doesn't leave less than rent-exempt balance
    let rent_balance = Rent::get()?.minimum_balance(inspector.to_account_info().data_len());
    require!(
        amount <= **inspector.to_account_info().lamports.borrow() - rent_balance,
        SupplyChainErrors::InsufficientBalance
    );

    // Validate platform address against programs_state.owner
    require!(
        platform_address.key() == programs_state.owner,
        SupplyChainErrors::UnauthorizedAccess
    );

    // Calculate platform fee and net amount for the payer
    let platform_fee = amount
        .checked_mul(programs_state.platform_fee as u64)
        .ok_or(SupplyChainErrors::Overflow)?
        .checked_div(100)
        .ok_or(SupplyChainErrors::Overflow)?;
    let net_amount = amount
        .checked_sub(platform_fee)
        .ok_or(SupplyChainErrors::Overflow)?;

    // Transfer funds
    // Decrease inspector's lamports by the full amount
    **inspector.to_account_info().try_borrow_mut_lamports()? -= amount;
    // Transfer net amount to payer
    **ctx
        .accounts
        .payer
        .to_account_info()
        .try_borrow_mut_lamports()? += net_amount;
    // Transfer platform fee to platform address
    **platform_address
        .to_account_info()
        .try_borrow_mut_lamports()? += platform_fee;

    // Update transaction details
    transaction.transaction_id = user
        .transaction_count
        .checked_add(1)
        .ok_or(SupplyChainErrors::Overflow)?;
    transaction.amount = amount; // Total amount withdrawn
    transaction.from = inspector.key();
    transaction.to = ctx.accounts.payer.key();
    transaction.timestamp = Clock::get()?.unix_timestamp as u64;
    transaction.status = true;

    // Update inspector balance and user transaction count
    inspector.balance = inspector
        .balance
        .checked_sub(amount)
        .ok_or(SupplyChainErrors::Overflow)?;
    user.transaction_count = user
        .transaction_count
        .checked_add(1)
        .ok_or(SupplyChainErrors::Overflow)?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawInspectorBalanceCtx<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        space = ANCHOR_DISCRIMINATOR_SIZE + Transaction::INIT_SPACE,
        payer = payer,
        seeds = [b"transaction", user.key().as_ref(), (user.transaction_count + 1).to_le_bytes().as_ref()],
        bump,
    )]
    pub transaction: Account<'info, Transaction>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub inspector: Account<'info, ProductInspector>,
    #[account(mut)]
    pub programs_state: Account<'info, ProgramState>,
    /// CHECK: Validated against programs_state.owner
    #[account(mut)]
    pub platform_address: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
