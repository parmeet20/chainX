use anchor_lang::prelude::*;
use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::errors::SupplyChainErrors;
use crate::states::program_state::ProgramState;
use crate::states::transaction::Transaction;
use crate::states::{factory::Factory, user::User};

pub fn withdraw_balance_as_factory(
    ctx: Context<WithdrawBalanceAsFactoryCtx>,
    amount: u64,
) -> Result<()> {
    let factory = &mut ctx.accounts.factory;
    let user = &mut ctx.accounts.user;
    let transaction = &mut ctx.accounts.transaction;
    let program_state = &ctx.accounts.programs_state;
    let platform_account_info = &ctx.accounts.platform_address;

    // Authorization checks
    require!(
        user.role == "FACTORY" && factory.owner.key() == ctx.accounts.owner.key(),
        SupplyChainErrors::UnauthorizedAccess
    );

    require!(
        amount >= 1_000_000_000,
        SupplyChainErrors::InsifficentWithdraw
    );

    // Check sufficient balance
    require!(
        factory.balance >= amount,
        SupplyChainErrors::InsufficientBalance
    );

    // Ensure withdrawal doesn't exceed usable balance (after rent)
    let rent_balance = Rent::get()?.minimum_balance(factory.to_account_info().data_len());
    require!(
        amount <= **factory.to_account_info().lamports.borrow() - rent_balance,
        SupplyChainErrors::InsufficientBalance
    );

    // Validate platform address
    require!(
        platform_account_info.key() == program_state.owner.key(),
        SupplyChainErrors::UnauthorizedAccess
    );

    // Calculate platform fee and remaining amount for the owner
    let platform_fee = amount
        .checked_mul(program_state.platform_fee)
        .ok_or(SupplyChainErrors::Overflow)?
        .checked_div(100)
        .ok_or(SupplyChainErrors::Overflow)?;
    let creator_amount = amount
        .checked_sub(platform_fee)
        .ok_or(SupplyChainErrors::Overflow)?;

    // Transfer funds to owner
    **factory.to_account_info().try_borrow_mut_lamports()? -= creator_amount;
    **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += creator_amount;

    // Transfer platform fee
    **factory.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
    **platform_account_info.to_account_info().try_borrow_mut_lamports()? += platform_fee;

    // Update transaction details
    transaction.transaction_id = user.transaction_count + 1;
    transaction.amount = amount;
    transaction.from = factory.key();
    transaction.to = ctx.accounts.owner.key();
    transaction.timestamp = Clock::get()?.unix_timestamp as u64;
    transaction.status = true;

    // Update factory balance and user's transaction count
    factory.balance = factory.balance.checked_sub(amount).ok_or(SupplyChainErrors::Overflow)?;
    user.transaction_count = user.transaction_count.checked_add(1).ok_or(SupplyChainErrors::Overflow)?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawBalanceAsFactoryCtx<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        space = ANCHOR_DISCRIMINATOR_SIZE + Transaction::INIT_SPACE,
        payer = owner,
        seeds = [
            b"transaction",
            user.key().as_ref(),
            (user.transaction_count + 1).to_le_bytes().as_ref()
        ],
        bump,
    )]
    pub transaction: Account<'info, Transaction>,
    #[account(mut)]
    pub factory: Account<'info, Factory>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub programs_state: Account<'info, ProgramState>,
    /// CHECK: Validated against programs_state.owner
    #[account(mut)]
    pub platform_address: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}