import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SupplyChain } from "../target/types/supply_chain";
import fs from 'fs';
import * as assert from 'assert'; // Added for assertions

const { PublicKey, SystemProgram } = anchor.web3;

const idl = require("../target/idl/supply_chain.json");

const keypairPath = './wallets/id.json';
const keyPairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
const wallet = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(keyPairData));

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
});