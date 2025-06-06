import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SupplyChain } from "../target/types/supply_chain";
import fs from 'fs';
import * as assert from 'assert'; // Added for assertions

const { PublicKey, SystemProgram } = anchor.web3;

const idl = require("../target/idl/supply_chain.json");

const keypair = './wallets/product_inspector.json';
const keypairData = JSON.parse(fs.readFileSync(keypair, 'utf-8'));
const product_inspector = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(keypairData));
const keypair1 = './wallets/warehouse.json';
const keypairData1 = JSON.parse(fs.readFileSync(keypair1, 'utf-8'));
const warehouse_wallet = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(keypairData1));
const keypair2 = './wallets/seller.json';
const keypairData2 = JSON.parse(fs.readFileSync(keypair2, 'utf-8'));
const seller_wallet = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(keypairData2));
const keypair3 = './wallets/logistics.json';
const keypairData3 = JSON.parse(fs.readFileSync(keypair3, 'utf-8'));
const logistic_wallet = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(keypairData3));
const keypairPath = './wallets/id.json';
const keyPairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
const wallet = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(keyPairData));
const keypair4 = './wallets/customer.json';
const keypairData4 = JSON.parse(fs.readFileSync(keypair4, 'utf-8'));
const customer_wallet = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(keypairData4));

describe("supply_chain", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = new Program<SupplyChain>(idl, provider);

  const [programStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_state")],
    program.programId
  );
  it('should update platform fee', async () => {
    const [programStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("program_state")],
      program.programId
    );
    const FEE = new anchor.BN(4);
    const tx = await program.methods.updatePlatformFee(FEE).accountsPartial({
      owner: wallet.publicKey,
      programState: programStatePda,
      systemProgram: SystemProgram.programId,
    }).signers([wallet]).rpc();
    const state = await program.account.programState.fetch(programStatePda);
    assert.ok(state.platformFee.eq(FEE), "Delivery fee should match");
  })
  it("should create a user", async () => {
    const creator = provider.wallet;
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const NAME = "user1";
    const ROLE = "FACTORY";
    const EMAIL = "demo@test.com";
    const userAccount = await program.account.user.fetchNullable(userPda);
    if (userAccount) {
      assert.strictEqual(userAccount.name, NAME, "Existing user name should match");
      assert.strictEqual(userAccount.role, ROLE, "Existing user role should match");
    } else {
      const tx = await program.methods
        .createUser(NAME, EMAIL, ROLE)
        .accountsPartial({
          user: userPda,
          owner: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      // console.log("Your transaction signature: ", tx);
      const newUserAccount = await program.account.user.fetch(userPda);
      assert.strictEqual(newUserAccount.name, NAME, "New user name should match");
      assert.strictEqual(newUserAccount.role, ROLE, "New user role should match");
      assert.strictEqual(newUserAccount.email, EMAIL, "New user role should match");
    }
  });

  it("should create a factory", async () => {
    const creator = provider.wallet;
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const userAccount = await program.account.user.fetch(userPda);
    const f_id = userAccount.factoryCount.add(new anchor.BN(1));
    const [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory"), userPda.toBuffer(), f_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const NAME = "factory1";
    const DESCRIPTION = "factory1 description";
    const LATITUDE = 123.456;
    const LONGITUDE = 78.91;
    const CONTACT_INFO = "factory1 contact info";
    const tx = await program.methods
      .createFactory(NAME, DESCRIPTION, LATITUDE, LONGITUDE, CONTACT_INFO)
      .accountsPartial({
        factory: factoryPda,
        user: userPda,
        owner: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const factory = await program.account.factory.fetch(factoryPda);
    assert.strictEqual(factory.name, NAME, "Factory name should match");
    assert.strictEqual(factory.description, DESCRIPTION, "Factory description should match");
    assert.strictEqual(factory.latitude, LATITUDE, "Factory latitude should match");
    assert.strictEqual(factory.longitude, LONGITUDE, "Factory longitude should match");
    assert.strictEqual(factory.contactInfo, CONTACT_INFO, "Factory contact info should match");
  });

  it('should create a new product', async () => {
    const creator = provider.wallet;
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const userAccount = await program.account.user.fetch(userPda);
    const f_id = userAccount.factoryCount;
    const [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory"), userPda.toBuffer(), f_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const factory = await program.account.factory.fetch(factoryPda);
    const p_id = factory.productCount.add(new anchor.BN(1));
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), factoryPda.toBuffer(), p_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const NAME = "product1";
    const DESCRIPTION = "product1 description";
    const IMAGE = "product.png";
    const PRICE = new anchor.BN(4_000_000_000);
    const QUANTITY = new anchor.BN(10);
    const BATCH_NO = "batch1";
    const MRP = new anchor.BN(10_000_000_000);
    const tx = await program.methods.createProduct(NAME, DESCRIPTION, IMAGE, BATCH_NO, PRICE, new anchor.BN(2_000_000), QUANTITY, MRP)
      .accountsPartial({
        product: productPda,
        factory: factoryPda,
        owner: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const product = await program.account.product.fetch(productPda);
    assert.strictEqual(product.productName, NAME, "Product name should match");
    assert.strictEqual(product.productDescription, DESCRIPTION, "Product description should match");
    assert.ok(product.productPrice.eq(PRICE), "Product price should match");
    assert.ok(product.productStock.eq(QUANTITY), "Product quantity should match");
    assert.strictEqual(product.batchNumber, BATCH_NO, "Product batch number should match");
    assert.strictEqual(product.productImage, IMAGE, "Product batch number should match");
    assert.ok(product.mrp.eq(MRP), "Product MRP should match");
  });

  it('should create a new user product_inspector id', async () => {
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), product_inspector.publicKey.toBuffer()],
      program.programId
    );
    const NAME = "product_inspector";
    const ROLE = "INSPECTOR";
    const userAccount = await program.account.user.fetchNullable(userPda);
    if (userAccount) {
      assert.strictEqual(userAccount.name, NAME, "Existing inspector name should match");
      assert.strictEqual(userAccount.role, ROLE, "Existing inspector role should match");
    } else {
      const tx = await program.methods.createUser(NAME, "demo7@example.com", ROLE)
        .accountsPartial({
          user: userPda,
          owner: product_inspector.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([product_inspector])
        .rpc();
      // console.log("Your transaction signature: ", tx);
      const newUserAccount = await program.account.user.fetch(userPda);
      assert.strictEqual(newUserAccount.name, NAME, "New inspector name should match");
      assert.strictEqual(newUserAccount.role, ROLE, "New inspector role should match");
      assert.strictEqual(newUserAccount.email, "demo7@example.com", "New inspector role should match");
    }
  });

  it('should inspect a product', async () => {
    const creator = provider.wallet;
    const [userFactoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const userAccount = await program.account.user.fetch(userFactoryPda);
    const f_id = userAccount.factoryCount;
    const [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory"), userFactoryPda.toBuffer(), f_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const factory = await program.account.factory.fetch(factoryPda);
    const p_id = factory.productCount;
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), factoryPda.toBuffer(), p_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [userInspectorPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), product_inspector.publicKey.toBuffer()],
      program.programId
    );
    const userInspector = await program.account.user.fetch(userInspectorPda);
    const i_id = userInspector.inspectorCount.add(new anchor.BN(1));
    const [inspectorPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_inspector"), userInspectorPda.toBuffer(), i_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const NAME = "inspector1";
    const LATITUDE = 123.456;
    const LONGITUDE = 78.91;
    const INSPECTION_OUTCOME = "PASS";
    const NOTES = "Product is good";
    const FEE_CHARGED_PER_PRODUCT = new anchor.BN(1_000_000_000);
    const tx = await program.methods
      .inspectProductInstruction(
        NAME,
        LATITUDE,
        LONGITUDE,
        new anchor.BN(p_id),
        INSPECTION_OUTCOME,
        NOTES,
        FEE_CHARGED_PER_PRODUCT
      )
      .accountsPartial({
        inspectionDetails: inspectorPda,
        factory: factoryPda,
        product: productPda,
        user: userInspectorPda,
        owner: product_inspector.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([product_inspector])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const inspectionDetails = await program.account.productInspector.fetch(inspectorPda);
    assert.strictEqual(inspectionDetails.name, NAME, "Inspector name should match");
    assert.strictEqual(inspectionDetails.latitude, LATITUDE, "Inspector latitude should match");
    assert.strictEqual(inspectionDetails.longitude, LONGITUDE, "Inspector longitude should match");
    assert.strictEqual(inspectionDetails.inspectionOutcome, INSPECTION_OUTCOME, "Inspection outcome should match");
    assert.strictEqual(inspectionDetails.notes, NOTES, "Inspection notes should match");
    assert.ok(inspectionDetails.feeChargePerProduct.eq(FEE_CHARGED_PER_PRODUCT), "Fee charged should match");
  });

  it('should pay product_inspector as factory', async () => {
    const creator = provider.wallet;
    const [userFactoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const userAccount = await program.account.user.fetch(userFactoryPda);
    const f_id = userAccount.factoryCount;
    const [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory"), userFactoryPda.toBuffer(), f_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const factory = await program.account.factory.fetch(factoryPda);
    const p_id = factory.productCount;
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), factoryPda.toBuffer(), p_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [userInspectorPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), product_inspector.publicKey.toBuffer()],
      program.programId
    );
    const userInspector = await program.account.user.fetch(userInspectorPda);
    const i_id = userInspector.inspectorCount;
    const [inspectorPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_inspector"), userInspectorPda.toBuffer(), i_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const transaction_count = userAccount.transactionCount.add(new anchor.BN(1));
    const [transactionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction"), userFactoryPda.toBuffer(), transaction_count.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const tx = await program.methods.payProductInspectorInstruction(i_id, p_id)
      .accountsPartial({
        transaction: transactionPda,
        user: userFactoryPda,
        inspector: inspectorPda,
        product: productPda,
        payer: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const transaction = await program.account.transaction.fetch(transactionPda);
    assert.ok(transaction.amount, "Transaction amount should be set");
  });

  it('should withdraw balance of inspector', async () => {
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), product_inspector.publicKey.toBuffer()],
      program.programId
    );
    const usr = await program.account.user.fetch(userPda);
    const [transactionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction"), userPda.toBuffer(), usr.transactionCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [inspectorPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product_inspector"), userPda.toBuffer(), usr.inspectorCount.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const WITHDRAW_AMOUNT = new anchor.BN(1_000_000_000);
    const tx = await program.methods.withdrawInspectorBalance(WITHDRAW_AMOUNT)
      .accountsPartial({
        transaction: transactionPda,
        inspector: inspectorPda,
        user: userPda,
        payer: product_inspector.publicKey,
        programsState: programStatePda,
        platformAddress: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([product_inspector])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const transaction = await program.account.transaction.fetch(transactionPda);
    assert.ok(transaction.amount.eq(WITHDRAW_AMOUNT), "Withdraw amount should match");
  });

  it('should create new warehouse user', async () => {
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), warehouse_wallet.publicKey.toBuffer()],
      program.programId
    );
    const NAME = "warehouse1";
    const ROLE = "WAREHOUSE";
    const userAccount = await program.account.user.fetchNullable(userPda);
    if (userAccount) {
      assert.strictEqual(userAccount.name, NAME, "Existing warehouse name should match");
      assert.strictEqual(userAccount.role, ROLE, "Existing warehouse role should match");
    } else {
      const tx = await program.methods.createUser(NAME, "demo2@example.com", ROLE)
        .accountsPartial({
          user: userPda,
          owner: warehouse_wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([warehouse_wallet])
        .rpc();
      // console.log("Your transaction signature: ", tx);
      const newUserAccount = await program.account.user.fetch(userPda);
      assert.strictEqual(newUserAccount.name, NAME, "New warehouse name should match");
      assert.strictEqual(newUserAccount.role, ROLE, "New warehouse role should match");
      assert.strictEqual(newUserAccount.email, "demo2@example.com", "New warehouse role should match");
    }
  });

  it('should create new warehouse', async () => {
    const creator = provider.wallet;
    const [userFactoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const userFactoryAccount = await program.account.user.fetch(userFactoryPda);
    const f_id = userFactoryAccount.factoryCount;
    const [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory"), userFactoryPda.toBuffer(), f_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const factory = await program.account.factory.fetch(factoryPda);
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), factoryPda.toBuffer(), factory.productCount.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [warehousePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), warehouse_wallet.publicKey.toBuffer()],
      program.programId
    );
    const warehouse_user = await program.account.user.fetch(warehousePda);
    const [wHousePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("warehouse"), warehousePda.toBuffer(), warehouse_user.warehouseCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const NAME = "NEW W";
    const DESCRIPTION = "NEW WAREHOUSE";
    const CONTACT_DETAILS = "CONTACT DETAILS";
    const LATITUDE = 123.23123;
    const LONGITUDE = 23.123124;
    const tx = await program.methods.createWarehouseInstrution(NAME, DESCRIPTION, CONTACT_DETAILS, f_id, new anchor.BN(50), LATITUDE, LONGITUDE)
      .accountsPartial({
        factory: factoryPda,
        user: warehousePda,
        owner: warehouse_wallet.publicKey,
        product: productPda,
        warehouse: wHousePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([warehouse_wallet])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const warehouse = await program.account.warehouse.fetch(wHousePda);
    assert.strictEqual(warehouse.name, NAME, "Warehouse name should match");
    assert.strictEqual(warehouse.description, DESCRIPTION, "Warehouse description should match");
    assert.strictEqual(warehouse.contactDetails, CONTACT_DETAILS, "Warehouse contact details should match");
    assert.strictEqual(warehouse.latitude, LATITUDE, "Warehouse latitude should match");
    assert.strictEqual(warehouse.longitude, LONGITUDE, "Warehouse longitude should match");
  });

  it('should buy product from factory as warehouse', async () => {
    const creator = provider.wallet;
    const [userFactoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const userFactoryAccount = await program.account.user.fetch(userFactoryPda);
    const f_id = userFactoryAccount.factoryCount;
    const [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory"), userFactoryPda.toBuffer(), f_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const factory = await program.account.factory.fetch(factoryPda);
    const p_id = factory.productCount;
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), factoryPda.toBuffer(), p_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [warehousePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), warehouse_wallet.publicKey.toBuffer()],
      program.programId
    );
    const warehouse_user = await program.account.user.fetch(warehousePda);
    const [wHousePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("warehouse"), warehousePda.toBuffer(), warehouse_user.warehouseCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const transaction_count = warehouse_user.transactionCount.add(new anchor.BN(1));
    const [transactionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction"), warehousePda.toBuffer(), transaction_count.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const QUANTITY = new anchor.BN(5);
    const tx = await program.methods.buyProductAsWarehouse(p_id, f_id, QUANTITY)
      .accountsPartial({
        transaction: transactionPda,
        user: warehousePda,
        product: productPda,
        factory: factoryPda,
        warehouse: wHousePda,
        warehouseOwner: warehouse_wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([warehouse_wallet])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const transaction = await program.account.transaction.fetch(transactionPda);
    assert.ok(transaction.amount, "Transaction amount should be set");
  });

  it('should create new seller user', async () => {
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), seller_wallet.publicKey.toBuffer()],
      program.programId
    );
    const NAME = "seller 1";
    const ROLE = "SELLER";
    const userAccount = await program.account.user.fetchNullable(userPda);
    if (userAccount) {
      assert.strictEqual(userAccount.name, NAME, "Existing seller name should match");
      assert.strictEqual(userAccount.role, ROLE, "Existing seller role should match");
    } else {
      const tx = await program.methods.createUser(NAME, "demo3@example.com", ROLE)
        .accountsPartial({
          user: userPda,
          owner: seller_wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller_wallet])
        .rpc();
      // console.log("Your transaction signature: ", tx);
      const newUserAccount = await program.account.user.fetch(userPda);
      assert.strictEqual(newUserAccount.name, NAME, "New seller name should match");
      assert.strictEqual(newUserAccount.role, ROLE, "New seller role should match");
      assert.strictEqual(newUserAccount.email, "demo3@example.com", "New seller role should match");
    }
  });

  it('should create new seller', async () => {
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), seller_wallet.publicKey.toBuffer()],
      program.programId
    );
    const usr = await program.account.user.fetch(userPda);
    const s_id = usr.sellerCount.add(new anchor.BN(1));
    const [sellerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("seller"), userPda.toBuffer(), s_id.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const NAME = "NEW SLLR";
    const DESCRIPTION = "NEW SLLR DESCRIPTION";
    const LATITUDE = 12.23323;
    const LONGITUDE = 34.23232;
    const CONTACT_INFO = "CONTACT INFO OF SELLER";
    const tx = await program.methods.createSellerInstruction(NAME, DESCRIPTION, LATITUDE, LONGITUDE, CONTACT_INFO)
      .accountsPartial({
        user: userPda,
        seller: sellerPda,
        owner: seller_wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller_wallet])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const seller = await program.account.seller.fetch(sellerPda);
    assert.strictEqual(seller.name, NAME, "Seller name should match");
    assert.strictEqual(seller.description, DESCRIPTION, "Seller description should match");
    assert.strictEqual(seller.latitude, LATITUDE, "Seller latitude should match");
    assert.strictEqual(seller.longitude, LONGITUDE, "Seller longitude should match");
    assert.strictEqual(seller.contactInfo, CONTACT_INFO, "Seller contact info should match");
  });

  it('should order product from warehouse as seller', async () => {
    const creator = provider.wallet;
    const [userFactoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const userFactoryAccount = await program.account.user.fetch(userFactoryPda);
    const f_id = userFactoryAccount.factoryCount;
    const [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory"), userFactoryPda.toBuffer(), f_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const factory = await program.account.factory.fetch(factoryPda);
    const p_id = factory.productCount;
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), factoryPda.toBuffer(), p_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [warehousePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), warehouse_wallet.publicKey.toBuffer()],
      program.programId
    );
    const warehouse_user = await program.account.user.fetch(warehousePda);
    const [wHousePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("warehouse"), warehousePda.toBuffer(), warehouse_user.warehouseCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const wHouse = await program.account.warehouse.fetch(wHousePda);
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), seller_wallet.publicKey.toBuffer()],
      program.programId
    );
    const usr = await program.account.user.fetch(userPda);
    const s_id = usr.sellerCount;
    const [sellerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("seller"), userPda.toBuffer(), s_id.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const slr = await program.account.seller.fetch(sellerPda);
    const [orderPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), sellerPda.toBuffer(), slr.orderCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [transactionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction"), userPda.toBuffer(), usr.transactionCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const QUANTITY = new anchor.BN(3);
    const tx = await program.methods.createOrderInstructionAsSeller(wHouse.warehouseId, p_id, QUANTITY)
      .accountsPartial({
        transaction: transactionPda,
        order: orderPda,
        warehouse: wHousePda,
        seller: sellerPda,
        user: userPda,
        product: productPda,
        sellerAccount: seller_wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller_wallet])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const order = await program.account.order.fetch(orderPda);
    assert.ok(order.productStock.eq(QUANTITY), "Order quantity should match");
  });

  it('should withdraw balance from the factory', async () => {
    const creator = provider.wallet;
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const user = await program.account.user.fetch(userPda);
    const factory_count = user.factoryCount;
    const [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory"), userPda.toBuffer(), factory_count.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [transactionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction"), userPda.toBuffer(), user.transactionCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const WITHDRAW_AMOUNT = new anchor.BN(1_000_000_000);
    const tx = await program.methods.withdrawBalanceAsFactory(WITHDRAW_AMOUNT)
      .accountsPartial({
        user: userPda,
        factory: factoryPda,
        owner: creator.publicKey,
        transaction: transactionPda,
        programsState: programStatePda,
        platformAddress: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator.payer])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const transaction = await program.account.transaction.fetch(transactionPda);
    assert.ok(transaction.amount.eq(WITHDRAW_AMOUNT), "Withdraw amount should match");
  });

  it('should withdraw balance from the warehouse', async () => {
    const [warehouseOwnerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), warehouse_wallet.publicKey.toBuffer()],
      program.programId
    );
    const wHouse = await program.account.user.fetch(warehouseOwnerPda);
    const [warehousePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("warehouse"), warehouseOwnerPda.toBuffer(), wHouse.warehouseCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [transactionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction"), warehouseOwnerPda.toBuffer(), wHouse.transactionCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const WITHDRAW_AMOUNT = new anchor.BN(1_000_000_000);
    const tx = await program.methods.withdrawBalanceAsWarehouseInstruction(WITHDRAW_AMOUNT)
      .accountsPartial({
        user: warehouseOwnerPda,
        warehouse: warehousePda,
        owner: warehouse_wallet.publicKey,
        programsState: programStatePda,
        transaction: transactionPda,
        platformAddress: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([warehouse_wallet])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const transaction = await program.account.transaction.fetch(transactionPda);
    assert.ok(transaction.amount.eq(WITHDRAW_AMOUNT), "Withdraw amount should match");
  });

  it('should create new logistic user', async () => {
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), logistic_wallet.publicKey.toBuffer()],
      program.programId
    );
    const NAME = "logistic 1";
    const ROLE = "LOGISTICS";
    const userAccount = await program.account.user.fetchNullable(userPda);
    if (userAccount) {
      assert.strictEqual(userAccount.name, NAME, "Existing logistic name should match");
      assert.strictEqual(userAccount.role, ROLE, "Existing logistic role should match");
    } else {
      const tx = await program.methods.createUser(NAME, "demo1@example.com", ROLE)
        .accountsPartial({
          user: userPda,
          owner: logistic_wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([logistic_wallet])
        .rpc();
      // console.log("Your transaction signature: ", tx);
      const newUserAccount = await program.account.user.fetch(userPda);
      assert.strictEqual(newUserAccount.name, NAME, "New logistic name should match");
      assert.strictEqual(newUserAccount.role, ROLE, "New logistic role should match");
      assert.strictEqual(newUserAccount.email, "demo1@example.com", "New logistic role should match");
    }
  });

  it('should create new logistic', async () => {
    const creator = provider.wallet;
    const [userFactoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const userFactoryAccount = await program.account.user.fetch(userFactoryPda);
    const f_id = userFactoryAccount.factoryCount;
    const [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory"), userFactoryPda.toBuffer(), f_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const factory = await program.account.factory.fetch(factoryPda);
    const p_id = factory.productCount;
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), factoryPda.toBuffer(), p_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [warehouseUserPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), warehouse_wallet.publicKey.toBuffer()],
      program.programId
    );
    const warehouseUser = await program.account.user.fetch(warehouseUserPda);
    const warehouseId = warehouseUser.warehouseCount;
    const [warehousePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("warehouse"), warehouseUserPda.toBuffer(), warehouseId.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [logUser] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), logistic_wallet.publicKey.toBuffer()],
      program.programId
    );
    const usr = await program.account.user.fetch(logUser);
    const [logisticPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("logistics"), logUser.toBuffer(), usr.logisticsCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const NAME = "LOG1";
    const VEHICLE_TYPE = "AIRPLANE";
    const CONTACT_INFO = "CNTCT INFO";
    const QUANTITY = new anchor.BN(0);
    const LATITUDE = 12.12122;
    const LONGITUDE = 23.21122;
    const tx = await program.methods.createLogisticsInstruction(
      NAME,
      VEHICLE_TYPE,
      CONTACT_INFO,
      p_id,
      warehouseId,
      LATITUDE,
      LONGITUDE
    )
      .accountsPartial({
        owner: logistic_wallet.publicKey,
        logistics: logisticPda,
        warehouse: warehousePda,
        product: productPda,
        user: logUser,
        systemProgram: SystemProgram.programId,
      })
      .signers([logistic_wallet])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const logistics = await program.account.logistics.fetch(logisticPda);
    assert.strictEqual(logistics.name, NAME, "Logistics name should match");
    assert.strictEqual(logistics.transportationMode, VEHICLE_TYPE, "Logistics vehicle type should match");
    assert.strictEqual(logistics.contactInfo, CONTACT_INFO, "Logistics contact info should match");
    assert.ok(logistics.productStock.eq(QUANTITY), "Logistics quantity should match");
    assert.strictEqual(logistics.latitude, LATITUDE, "Logistics latitude should match");
    assert.strictEqual(logistics.longitude, LONGITUDE, "Logistics longitude should match");
  });

  it('should send logistic to seller', async () => {
    const creator = provider.wallet;
    const [userFactoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const userFactoryAccount = await program.account.user.fetch(userFactoryPda);
    const f_id = userFactoryAccount.factoryCount;
    const [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory"), userFactoryPda.toBuffer(), f_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const factory = await program.account.factory.fetch(factoryPda);
    const p_id = factory.productCount;
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), factoryPda.toBuffer(), p_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [warehouseUserPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), warehouse_wallet.publicKey.toBuffer()],
      program.programId
    );
    const warehouse_usr = await program.account.user.fetch(warehouseUserPda);
    const [warehousePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("warehouse"), warehouseUserPda.toBuffer(), warehouse_usr.warehouseCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const warehouse = await program.account.warehouse.fetch(warehousePda);
    const [seller_user_pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), seller_wallet.publicKey.toBuffer()],
      program.programId
    );
    const seller = await program.account.user.fetch(seller_user_pda);
    const [sellerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("seller"), seller_user_pda.toBuffer(), seller.sellerCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const sllr = await program.account.seller.fetch(sellerPda);
    const [orderPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), sellerPda.toBuffer(), sllr.orderCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [logisticUserPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), logistic_wallet.publicKey.toBuffer()],
      program.programId
    );
    const logisticUsr = await program.account.user.fetch(logisticUserPda);
    const [logisticPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("logistics"), logisticUserPda.toBuffer(), logisticUsr.logisticsCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const logistic = await program.account.logistics.fetch(logisticPda);
    const [transactionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction"), warehouseUserPda.toBuffer(), warehouse_usr.transactionCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const DELIVERY_FEE = new anchor.BN(2_000_000_000);
    const tx = await program.methods.sendLogisticsToSellerInstruction(logistic.logisticId, p_id, warehouse.warehouseId, DELIVERY_FEE)
      .accountsPartial({
        signer: seller_wallet.publicKey,
        logistics: logisticPda,
        transaction: transactionPda,
        warehouse: warehousePda,
        product: productPda,
        user: warehouseUserPda,
        order: orderPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller_wallet])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const transaction = await program.account.transaction.fetch(transactionPda);
    assert.ok(transaction.amount.eq(DELIVERY_FEE), "Delivery fee should match");
  });

  it('should receive product from the logistic', async () => {
    const [logisticUserPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), logistic_wallet.publicKey.toBuffer()],
      program.programId
    );
    const logisticUsr = await program.account.user.fetch(logisticUserPda);
    const [logisticPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("logistics"), logisticUserPda.toBuffer(), logisticUsr.logisticsCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [seller_user_pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), seller_wallet.publicKey.toBuffer()],
      program.programId
    );
    const seller = await program.account.user.fetch(seller_user_pda);
    const [sellerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("seller"), seller_user_pda.toBuffer(), seller.sellerCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const sllr = await program.account.seller.fetch(sellerPda);
    const [orderPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), sellerPda.toBuffer(), sllr.orderCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [seller_productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("seller_product"), sellerPda.toBuffer(), sllr.productsCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const tx = await program.methods.receiveProductInstructionAsSeller()
      .accountsPartial({
        signer: seller_wallet.publicKey,
        user: seller_user_pda,
        seller: sellerPda,
        sellerProductStock: seller_productPda,
        logistics: logisticPda,
        order: orderPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller_wallet])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const sellerProduct = await program.account.sellerProductStock.fetch(seller_productPda);
    assert.ok(sellerProduct.stockQuantity, "Seller product quantity should be set");
  });

  it('should withdraw balance as logistics', async () => {
    const [logisticUserPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), logistic_wallet.publicKey.toBuffer()],
      program.programId
    );
    const logisticUsr = await program.account.user.fetch(logisticUserPda);
    const [logisticPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("logistics"), logisticUserPda.toBuffer(), logisticUsr.logisticsCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [transactionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction"), logisticUserPda.toBuffer(), logisticUsr.transactionCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const WITHDRAW_AMOUNT = new anchor.BN(1_000_000_000);
    const tx = await program.methods.withdrawBalanceAsLogisticsInstruction(WITHDRAW_AMOUNT)
      .accountsPartial({
        owner: logistic_wallet.publicKey,
        transaction: transactionPda,
        user: logisticUserPda,
        logistics: logisticPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([logistic_wallet])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const transaction = await program.account.transaction.fetch(transactionPda);
    assert.ok(transaction.amount.eq(WITHDRAW_AMOUNT), "Withdraw amount should match");
  });

  it('should create a new customer', async () => {
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), customer_wallet.publicKey.toBuffer()],
      program.programId
    );
    const NAME = "customer random";
    const ROLE = "CUSTOMER";
    const userAccount = await program.account.user.fetchNullable(userPda);
    if (userAccount) {
      assert.strictEqual(userAccount.name, NAME, "Existing customer name should match");
      assert.strictEqual(userAccount.role, ROLE, "Existing customer role should match");
    } else {
      const tx = await program.methods
        .createUser(NAME, "demo5@example.com", ROLE)
        .accountsPartial({
          user: userPda,
          owner: customer_wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([customer_wallet])
        .rpc();
      // console.log("Your transaction signature: ", tx);
      const newUserAccount = await program.account.user.fetch(userPda);
      assert.strictEqual(newUserAccount.name, NAME, "New customer name should match");
      assert.strictEqual(newUserAccount.role, ROLE, "New customer role should match");
      assert.strictEqual(newUserAccount.email, "demo5@example.com", "New customer role should match");
    }
  });

  it('should buy product as customer', async () => {
    const [seller_user_pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), seller_wallet.publicKey.toBuffer()],
      program.programId,
    )
    const seller = await program.account.user.fetch(seller_user_pda);
    const [sellerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("seller"), seller_user_pda.toBuffer(), seller.sellerCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const creator = provider.wallet;
    const [userFactoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), creator.publicKey.toBuffer()],
      program.programId
    );
    const userFactoryAccount = await program.account.user.fetch(userFactoryPda);
    const f_id = userFactoryAccount.factoryCount;
    const [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory"), userFactoryPda.toBuffer(), f_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const factory = await program.account.factory.fetch(factoryPda);
    const p_id = factory.productCount;
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("product"), factoryPda.toBuffer(), p_id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), customer_wallet.publicKey.toBuffer()],
      program.programId
    );
    const usr = await program.account.user.fetch(userPda);
    const [customer_product_pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("customer_product"), userPda.toBuffer(), usr.productCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [transactionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction"), userPda.toBuffer(), usr.transactionCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const sllr = await program.account.seller.fetch(sellerPda);
    const [seller_productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("seller_product"), sellerPda.toBuffer(), sllr.productsCount.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const tx = await program.methods.buyProductAsCustomerCtx(new anchor.BN(2)).accountsPartial({
      seller: sellerPda,
      sellerProduct: seller_productPda,
      product: productPda,
      user: userPda,
      buyer: customer_wallet.publicKey,
      customerProduct: customer_product_pda,
      transaction: transactionPda,
      systemProgram: SystemProgram.programId,
    }).signers([customer_wallet]).rpc();
    const transaction = await program.account.transaction.fetch(transactionPda);
  })

  it('should withdraw balance of seller', async () => {
    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), seller_wallet.publicKey.toBuffer()],
      program.programId
    );
    const usr = await program.account.user.fetch(userPda);
    const [transactionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("transaction"), userPda.toBuffer(), usr.transactionCount.add(new anchor.BN(1)).toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [sellerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("seller"), userPda.toBuffer(), usr.sellerCount.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const WITHDRAW_AMOUNT = new anchor.BN(1_000_000_000);
    const tx = await program.methods.withdrawBalanceAsSellerInstruction(WITHDRAW_AMOUNT)
      .accountsPartial({
        transaction: transactionPda,
        seller: sellerPda,
        user: userPda,
        owner: seller_wallet.publicKey,
        programsState: programStatePda,
        platformAddress: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller_wallet])
      .rpc();
    // console.log("Your transaction signature: ", tx);
    const transaction = await program.account.transaction.fetch(transactionPda);
    assert.ok(transaction.amount.eq(WITHDRAW_AMOUNT), "Withdraw amount should match");
  });
  
});