import { SupplyChain } from "@/utils/supply_chain";
import { BN, Program } from "@coral-xyz/anchor";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionSignature,
} from "@solana/web3.js";
import { getUserWithPda } from "../user/userService";
import { ILogistics, IWarehouse } from "@/utils/types";

export const getAllMyLogistics = async (
  program: Program<SupplyChain>,
  publicKey: PublicKey
): Promise<ILogistics[]> => {
  const log = await program.account.logistics.all();
  return log
    .filter((l) => l.account.owner.toString() === publicKey.toString())
    .map((l) => ({
      logistic_id: l.account.logisticId,
      name: l.account.name,
      transportation_mode: l.account.transportationMode,
      contact_info: l.account.contactInfo,
      status: l.account.status,
      shipment_cost: l.account.shipmentCost,
      product_id: l.account.productId,
      product_pda: l.account.productPda,
      product_stock: l.account.productStock,
      delivery_confirmed: l.account.deliveryConfirmed,
      balance: l.account.balance,
      warehouse_id: l.account.warehouseId,
      latitude: l.account.latitude,
      longitude: l.account.longitude,
      shipment_started_at: l.account.shipmentStartedAt,
      shipment_ended_at: l.account.shipmentEndedAt,
      delivered: l.account.delivered,
      owner: l.account.owner,
      publicKey: l.publicKey,
    }));
};

export const getAllAvailableLogisticsForSeller = async (
  program: Program<SupplyChain>
): Promise<ILogistics[]> => {
  const logis = await program.account.logistics.all();
  return logis
    .filter((l) => Number(l.account.balance) === 0)
    .map((l) => ({
      logistic_id: l.account.logisticId,
      name: l.account.name,
      transportation_mode: l.account.transportationMode,
      contact_info: l.account.contactInfo,
      status: l.account.status,
      shipment_cost: l.account.shipmentCost,
      product_id: l.account.productId,
      product_pda: l.account.productPda,
      product_stock: l.account.productStock,
      delivery_confirmed: l.account.deliveryConfirmed,
      balance: l.account.balance,
      warehouse_id: l.account.warehouseId,
      latitude: l.account.latitude,
      longitude: l.account.longitude,
      shipment_started_at: l.account.shipmentStartedAt,
      shipment_ended_at: l.account.shipmentEndedAt,
      delivered: l.account.delivered,
      owner: l.account.owner,
      publicKey: l.publicKey,
    }));
};

export const lookForOrderAsLogistics = async (
  program: Program<SupplyChain>
): Promise<IWarehouse[]> => {
  const warehouses = await program.account.warehouse.all();
  const filtered = warehouses.filter((w) => w.account.productCount > 0);
  return filtered.map((w) => ({
    warehouse_id: w.account.warehouseId,
    factory_id: w.account.factoryId,
    created_at: w.account.createdAt,
    name: w.account.name,
    description: w.account.description,
    product_id: w.account.productId,
    product_pda: w.account.productPda,
    product_count: w.account.productCount,
    latitude: w.account.latitude,
    longitude: w.account.longitude,
    balance: w.account.balance,
    contact_details: w.account.contactDetails,
    owner: w.account.owner,
    warehouse_size: w.account.warehouseSize,
    publicKey: w.publicKey,
    logistic_count: w.account.logisticCount,
  }));
};

export const createLogistic = async (
  program: Program<SupplyChain>,
  name: string,
  mode: string,
  productStock: number,
  latitude: number,
  longitude: number,
  contactInfo: string,
  warehousePda: string,
  publicKey: PublicKey
): Promise<TransactionSignature> => {
  const user_pda = await getUserWithPda(program, publicKey);
  const usr = await program.account.user.fetch(user_pda);
  const w = await program.account.warehouse.fetch(new PublicKey(warehousePda));
  const product = await program.account.product.fetch(w.productPda);
  const [logisticPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("logistics"),
      user_pda.toBuffer(),
      usr.logisticsCount.add(new BN(1)).toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );
  const tx = await program.methods
    .createLogisticsInstruction(
      name,
      mode,
      contactInfo,
      product.productId,
      w.warehouseId,
      latitude,
      longitude
    )
    .accountsPartial({
      owner: publicKey,
      logistics: logisticPda,
      warehouse: warehousePda,
      product: w.productPda,
      user: user_pda,
      systemProgram: SystemProgram.programId,
    })
    .signers([])
    .rpc();
  return tx;
};

export const getLogistic = async (
  program: Program<SupplyChain>,
  logistic_pda: string
): Promise<ILogistics> => {
  const log = await program.account.logistics.fetch(
    new PublicKey(logistic_pda)
  );
  return {
    logistic_id: log.logisticId,
    name: log.name,
    transportation_mode: log.transportationMode,
    contact_info: log.contactInfo,
    status: log.status,
    shipment_cost: log.shipmentCost,
    product_id: log.productId,
    product_stock: log.productStock,
    delivery_confirmed: log.deliveryConfirmed,
    balance: log.balance,
    warehouse_id: log.warehouseId,
    latitude: log.latitude,
    longitude: log.longitude,
    shipment_started_at: log.shipmentStartedAt,
    shipment_ended_at: log.shipmentEndedAt,
    delivered: log.delivered,
    owner: log.owner,
    publicKey: new PublicKey(logistic_pda),
  };
};

export const withdrawLogisticsBalance = async (
  program: Program<SupplyChain>,
  logistic_pda: string,
  amount: number,
  publicKey: PublicKey
): Promise<TransactionSignature> => {
  const user_pda = await getUserWithPda(program, publicKey);
  const usr = await program.account.user.fetch(new PublicKey(user_pda));
  const [transactionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("transaction"),
      user_pda.toBuffer(),
      usr.transactionCount.add(new BN(1)).toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );
  const tx = await program.methods
    .withdrawBalanceAsLogisticsInstruction(new BN(amount * LAMPORTS_PER_SOL))
    .accountsPartial({
      transaction: transactionPda,
      logistics: new PublicKey(logistic_pda),
      user: user_pda,
      owner: publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([])
    .rpc();
  return tx;
};
