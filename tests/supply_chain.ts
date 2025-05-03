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
});