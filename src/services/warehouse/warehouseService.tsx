import { SupplyChain } from "@/utils/supply_chain";
import { IProduct, IWarehouse } from "@/utils/types";
import { BN, Program } from "@coral-xyz/anchor";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionSignature,
} from "@solana/web3.js";
import { getUserWithPda } from "../user/userService";

export const getAllMyWarehouses = async (
  program: Program<SupplyChain>,
  publicKey: PublicKey
): Promise<IWarehouse[]> => {
  const warehouses = await program.account.warehouse.all();
  return warehouses
    .filter((w) => w.account.owner.toString() === publicKey.toString())
    .map((w) => {
      return {
        warehouse_id: w.account.warehouseId,
        factory_id: w.account.factoryId,
        created_at: w.account.createdAt,
        name: w.account.name,
        description: w.account.description,
        product_id: w.account.productId,
        product_count: w.account.productCount,
        latitude: w.account.latitude,
        product_pda: w.account.productPda,
        longitude: w.account.longitude,
        balance: Number(w.account.balance / LAMPORTS_PER_SOL),
        contact_details: w.account.contactDetails,
        owner: w.account.owner,
        warehouse_size: w.account.warehouseSize,
        logistic_count: w.account.logisticCount,
        publicKey: w.publicKey,
      };
    });
};

export const getWarehouse = async (
  program: Program<SupplyChain>,
  warehouse_pda: string
): Promise<IWarehouse> => {
  const w_pda = new PublicKey(warehouse_pda);
  const warehouse = await program.account.warehouse.fetch(w_pda);
  return {
    warehouse_id: warehouse.warehouseId,
    factory_id: warehouse.factoryId,
    created_at: warehouse.createdAt,
    name: warehouse.name,
    description: warehouse.description,
    product_id: warehouse.productId,
    product_count: warehouse.productCount,
    latitude: warehouse.latitude,
    longitude: warehouse.longitude,
    balance: Number(warehouse.balance / LAMPORTS_PER_SOL),
    contact_details: warehouse.contactDetails,
    owner: warehouse.owner,
    warehouse_size: warehouse.warehouseSize,
    product_pda: warehouse.productPda,
    logistic_count: w_pda,
    publicKey: w_pda,
  };
};

export const getProductsForWarehouse = async (
  program: Program<SupplyChain>
): Promise<IProduct[]> => {
  const products = await program.account.product.all();
  return products
    .filter((p) => p.account.qualityChecked)
    .map((p) => ({
      product_id: p.account.productId,
      product_name: p.account.productName,
      product_description: p.account.productDescription,
      batch_number: p.account.batchNumber,
      factory_id: p.account.factoryId,
      product_price: p.account.productPrice / LAMPORTS_PER_SOL,
      product_stock: p.account.productStock,
      quality_checked: p.account.qualityChecked,
      inspection_id: p.account.inspectionId,
      mrp: p.account.mrp / LAMPORTS_PER_SOL,
      created_at: p.account.createdAt,
      publicKey: p.publicKey,
      inspector_pda: p.account.inspectorPda,
      inspection_fee_paid: p.account.inspectionFeePaid,
      factory_pda: p.account.factoryPda,
    }));
};

export const createNewWarehouse: (
  program: Program<SupplyChain>,
  name: string,
  description: string,
  contact_details: string,
  latitude: number,
  longitude: number,
  warehouse_size: number,
  factory_id: number,
  factory_pda: string,
  product_pda: string,
  publicKey: PublicKey
) => Promise<TransactionSignature> = async (
  program,
  name,
  description,
  contact_details,
  latitude,
  longitude,
  warehouse_size,
  factory_id,
  factory_pda,
  product_pda,
  publicKey
) => {
  const usr_pda = await getUserWithPda(
    program,
    typeof publicKey === "string" ? new PublicKey(publicKey) : publicKey
  );
  const usr = await program.account.user.fetch(usr_pda);
  const [wHousePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("warehouse"),
      usr_pda.toBuffer(),
      usr.warehouseCount.add(new BN(1)).toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );
  const tx = await program.methods
    .createWarehouseInstrution(
      name,
      description,
      contact_details,
      new BN(factory_id),
      new BN(warehouse_size),
      latitude,
      longitude
    )
    .accountsPartial({
      factory: factory_pda,
      user: usr_pda,
      owner: publicKey,
      warehouse: wHousePda,
      product: product_pda,
      systemProgram: SystemProgram.programId,
    })
    .signers([])
    .rpc();
  return tx;
};

export const withdrawWarehouseBalance = async (
  program: Program<SupplyChain>,
  warehouse_pda: string,
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

  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_state")],
    program.programId
  );
  const ownr = await program.account.programState.fetch(programStatePda);

  const tx = await program.methods
    .withdrawBalanceAsWarehouseInstruction(new BN(amount * LAMPORTS_PER_SOL))
    .accountsPartial({
      transaction: transactionPda,
      warehouse: new PublicKey(warehouse_pda),
      user: user_pda,
      programsState: programStatePda,
      platformAddress: ownr.owner,
      owner: publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([])
    .rpc();
  return tx;
};

export const buyStockForWarehouse = async (
  program: Program<SupplyChain>,
  product_id: number,
  product_pda: string,
  factory_id: number,
  warehouse_id: number,
  stock: number,
  publicKey: PublicKey
): Promise<TransactionSignature> => {
  const usr_pda = await getUserWithPda(program, publicKey);
  const usr = await program.account.user.fetch(usr_pda);
  const [wHousePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("warehouse"),
      usr_pda.toBuffer(),
      new BN(warehouse_id).toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );
  const [tranasctionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("transaction"),
      usr_pda.toBuffer(),
      usr.transactionCount.add(new BN(1)).toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );
  const product = await program.account.product.fetch(product_pda);
  const factoryPda = product.factoryPda;
  const tx = await program.methods
    .buyProductAsWarehouse(
      new BN(product_id),
      new BN(factory_id),
      new BN(stock)
    )
    .accountsPartial({
      transaction: tranasctionPda,
      user: usr_pda,
      product: product_pda,
      factory: factoryPda,
      warehouse: wHousePda,
      warehouseOwner: publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([])
    .rpc();
  return tx;
};

export const sendLogisticToSeller = async (
  program: Program<SupplyChain>,
  logistic_pda: string,
  order_pda: string,
  warehouse_pda: string,
  logistic_fee: number,
  publicKey: PublicKey
): Promise<TransactionSignature> => {
  const user_pda = await getUserWithPda(program, publicKey);
  const user = await program.account.user.fetch(user_pda);
  const warehouse = await program.account.warehouse.fetch(
    new PublicKey(warehouse_pda)
  );
  const logistic = await program.account.logistics.fetch(
    new PublicKey(logistic_pda)
  );
  const [transactionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("transaction"),
      user_pda.toBuffer(),
      user.transactionCount.add(new BN(1)).toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );
  const tx = await program.methods
    .sendLogisticsToSellerInstruction(
      logistic.logisticId,
      warehouse.productId,
      warehouse.warehouseId,
      new BN(logistic_fee * LAMPORTS_PER_SOL)
    )
    .accountsPartial({
      signer: publicKey,
      logistics: new PublicKey(logistic_pda),
      transaction: transactionPda,
      warehouse: new PublicKey(warehouse_pda),
      product: warehouse.productPda,
      user: user_pda,
      order: new PublicKey(order_pda),
      systemProgram: SystemProgram.programId,
    })
    .signers([])
    .rpc();
  return tx;
};

export const getWarehouseByProdPda = async (
  program: Program<SupplyChain>,
  prodPda: string
): Promise<IWarehouse> => {
  const warehouse = await program.account.warehouse.all();
  const myWarehouse = warehouse.find(
    (w) => w.account.productPda.toString() === prodPda.toString()
  );
  if (!myWarehouse) {
    throw new Error("Warehouse not found for the given product PDA");
  }
  return {
    warehouse_id: myWarehouse.account.warehouseId,
    factory_id: myWarehouse.account.factoryId,
    created_at: myWarehouse.account.createdAt,
    name: myWarehouse.account.name,
    description: myWarehouse.account.description,
    product_id: myWarehouse.account.productId,
    product_count: myWarehouse.account.productCount,
    latitude: myWarehouse.account.latitude,
    longitude: myWarehouse.account.longitude,
    balance: Number(myWarehouse.account.balance / LAMPORTS_PER_SOL),
    contact_details: myWarehouse.account.contactDetails,
    owner: myWarehouse.account.owner,
    warehouse_size: myWarehouse.account.warehouseSize,
    logistic_count: myWarehouse.account.logisticCount,
    product_pda: myWarehouse.account.productPda,
    publicKey: myWarehouse.publicKey,
  };
};
