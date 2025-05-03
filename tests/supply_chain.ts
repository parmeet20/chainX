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
});