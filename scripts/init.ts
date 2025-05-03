import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import { SupplyChain } from '../target/types/supply_chain';
import { BN } from 'bn.js';
const idl = require("../target/idl/supply_chain.json");
const { PublicKey, SystemProgram } = anchor.web3;

export const main = async (cluster: string) => {
    const clustersUrls: any = {
        'mainnet-beta': 'https://api.mainnet-beta.solana.com',
        'testnet': 'https://api.testnet.solana.com',
        'devnet': 'https://api.devnet.solana.com',
        'localhost': 'http://localhost:8899',
    }
    const connection = new anchor.web3.Connection(
        clustersUrls[cluster],
        'confirmed',
    )

    const keypairPath = './wallets/id.json'
    const keyPairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
    const wallet = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(keyPairData));
    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), {
        commitment: 'confirmed',
    });
    anchor.setProvider(provider);

    const program = new anchor.Program<SupplyChain>(idl, provider);
    const [programStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("program_state")],
        program.programId
    );

    try {
        const state = await program.account.programState.fetch(programStatePda);
        console.log(`Program already initialized: ${state.initialized}`);
    } catch (error) {
        const tx = await program.methods.initializeProgramState().accountsPartial({
            programState: programStatePda,
            owner: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).rpc();
        await connection.confirmTransaction(tx, 'finalized');
        console.log('Program initialized successfully: ', tx);
    }
}
const cluster: string = 'localhost';
main(cluster).catch((err) => console.log(err));