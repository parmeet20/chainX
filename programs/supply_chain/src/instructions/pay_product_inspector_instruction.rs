use anchor_lang::prelude::*;

use crate::constants::ANCHOR_DISCRIMINATOR_SIZE;
use crate::errors::SupplyChainErrors::*;
use crate::states::{
    product::Product, product_inspector::ProductInspector, transaction::Transaction, user::User,
};

pub fn pay_product_inspector_instruction(
    ctx: Context<PayProductInspectorInstruction>,
    inspector_id: u64,
    product_id: u64,
) -> Result<()> {
    let user = &mut ctx.accounts.user;
    let inspector = &mut ctx.accounts.inspector;
    let product = &mut ctx.accounts.product;
    let payer = &mut ctx.accounts.payer;
    let transaction = &mut ctx.accounts.transaction;
    if user.role != "FACTORY" {
        return Err(UnauthorizedAccess.into());
    }
    if product.product_id != product_id {
        return Err(InvalidProductId.into());
    }
    if product.inspection_id != inspector_id {
        return Err(InvalidInspectorId.into());
    }
    if product.quality_checked == false {
        return Err(ProductNotQualityChecked.into());
    }

    let total_amount_to_pay = match inspector
        .fee_charge_per_product
        .checked_mul(product.product_stock)
    {
        Some(result) => result,
        None => {
            return Err(Overflow.into());
        }
    };
    let tx_instruction = anchor_lang::solana_program::system_instruction::transfer(
        &payer.key(),
        &inspector.key(),
        total_amount_to_pay,
    );
    let result = anchor_lang::solana_program::program::invoke(
        &tx_instruction,
        &[payer.to_account_info(), inspector.to_account_info()],
    );
    if let Err(e) = result {
        msg!("Transaction to product_inspector failed: {:?}", e);
        return Err(e.into());
    }
    transaction.transaction_id = user.transaction_count + 1;
    transaction.from = payer.key();
    transaction.to = inspector.key();
    transaction.amount = total_amount_to_pay;
    transaction.timestamp = Clock::get()?.unix_timestamp as u64;
    transaction.status = true;

    inspector.balance += total_amount_to_pay;

    user.transaction_count += 1;

    product.inspection_fee_paid = true;
    Ok(())
}

#[derive(Accounts)]
pub struct PayProductInspectorInstruction<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 * ANCHOR_DISCRIMINATOR_SIZE + ProductInspector::INIT_SPACE,
        seeds = [b"transaction",user.key().as_ref(),(user.transaction_count+1).to_le_bytes().as_ref()],
        bump,
    )]
    pub transaction: Account<'info, Transaction>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub inspector: Account<'info, ProductInspector>,
    #[account(mut)]
    pub product: Account<'info, Product>,
    // #[account(mut)]
    // pub factory: Account<'info, Factory>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
