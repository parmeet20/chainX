use anchor_lang::prelude::*;

use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::errors::SupplyChainErrors;
use crate::states::program_state::ProgramState;
use crate::states::{transaction::Transaction, user::User, warehouse::Warehouse};

pub fn withdraw_balance_as_warehouse_instruction(
    ctx: Context<WithdrawBalanceAsWarehouseCtx>,
    amount: u64,
) -> Result<()> {
    let warehouse = &mut ctx.accounts.warehouse;
    let user = &mut ctx.accounts.user;
    let transaction = &mut ctx.accounts.transaction;
    let program_state = &mut ctx.accounts.programs_state;
    let platform_account_info = &mut ctx.accounts.platform_address;

    require!(
        user.role == "WAREHOUSE" || ctx.accounts.owner.key() == warehouse.owner.key(),
        SupplyChainErrors::UnauthorizedAccess
    );

    require!(
        amount >= 1_000_000_000,
        SupplyChainErrors::InsifficentWithdraw
    );

    if warehouse.balance < amount {
        return Err(SupplyChainErrors::InsufficientBalance.into());
    }

    let rent_balance = Rent::get()?.minimum_balance(warehouse.to_account_info().data_len());
    if amount > **warehouse.to_account_info().lamports.borrow() - rent_balance {
        msg!("Withdrawal exceed warehouse's usable balance");
        return Err(SupplyChainErrors::InsufficientBalance.into());
    }

    if platform_account_info.key() != program_state.owner.key() {
        return Err(SupplyChainErrors::UnauthorizedAccess.into());
    }

    let platform_fee = amount
        .checked_mul(program_state.platform_fee)
        .ok_or(SupplyChainErrors::Overflow)?
        .checked_div(100)
        .ok_or(SupplyChainErrors::Overflow)?;

    let creator_amount = amount
        .checked_sub(platform_fee)
        .ok_or(SupplyChainErrors::Overflow)?;

    **warehouse.to_account_info().try_borrow_mut_lamports()? -= creator_amount;
    **ctx
        .accounts
        .owner
        .to_account_info()
        .try_borrow_mut_lamports()? += creator_amount;

    **warehouse.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
    **platform_account_info
        .to_account_info()
        .try_borrow_mut_lamports()? += platform_fee;

    transaction.amount = amount;
    transaction.from = warehouse.key();
    transaction.to = ctx.accounts.owner.key();
    transaction.timestamp = Clock::get()?.unix_timestamp as u64;
    transaction.status = true;

    warehouse.balance = warehouse
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
pub struct WithdrawBalanceAsWarehouseCtx<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        space = ANCHOR_DISCRIMINATOR_SIZE + Transaction::INIT_SPACE,
        payer = owner,
        seeds = [b"transaction",user.key().as_ref(),(user.transaction_count+1).to_le_bytes().as_ref()],
        bump,
    )]
    pub transaction: Account<'info, Transaction>,
    #[account(mut)]
    pub warehouse: Account<'info, Warehouse>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub programs_state: Account<'info, ProgramState>,
    /// CHECK: We are passing the account to be used for receiving the platform charges as the
    #[account(mut)]
    pub platform_address: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
