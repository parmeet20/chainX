use anchor_lang::prelude::*;

use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::errors::SupplyChainErrors;
use crate::states::{logistics::Logistics, transaction::Transaction, user::User};

pub fn withdraw_balance_as_logistics_instruction(
    ctx: Context<WithdrawBalanceAsLogisticCtx>,
    amount: u64,
) -> Result<()> {
    let user = &mut ctx.accounts.user;
    let transaction = &mut ctx.accounts.transaction;
    let logistics = &mut ctx.accounts.logistics;
    let owner = ctx.accounts.owner.key();

    require!(
        owner == logistics.owner.key(),
        SupplyChainErrors::UnauthorizedAccess
    );
    require!(
        user.role == "LOGISTICS",
        SupplyChainErrors::UnauthorizedAccess
    );

    let rent_balance = Rent::get()?.minimum_balance(logistics.to_account_info().data_len());
    if amount > **logistics.to_account_info().lamports.borrow() - rent_balance {
        msg!("Withdrawal exceed logistic's usable balance");
        return Err(SupplyChainErrors::InsufficientBalance.into());
    }

    **logistics.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx
        .accounts
        .owner
        .to_account_info()
        .try_borrow_mut_lamports()? += amount;

    transaction.transaction_id = user
        .transaction_count
        .checked_add(1)
        .ok_or(SupplyChainErrors::Overflow)?;
    transaction.amount = amount;
    transaction.from = logistics.key();
    transaction.to = owner;
    transaction.timestamp = Clock::get()?.unix_timestamp as u64;
    transaction.status = true;

    user.transaction_count = user
        .transaction_count
        .checked_add(1)
        .ok_or(SupplyChainErrors::Overflow)?;

    logistics.balance = logistics
        .balance
        .checked_sub(amount)
        .ok_or(SupplyChainErrors::Overflow)?;
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawBalanceAsLogisticCtx<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = ANCHOR_DISCRIMINATOR_SIZE + Transaction::INIT_SPACE,
        seeds = [b"transaction",user.key().as_ref(),(user.transaction_count+1).to_le_bytes().as_ref()],
        bump,
    )]
    pub transaction: Account<'info, Transaction>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub logistics: Account<'info, Logistics>,
    pub system_program: Program<'info, System>,
}
