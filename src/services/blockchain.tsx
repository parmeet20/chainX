import { SupplyChain } from "@/utils/supply_chain";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import idl from "@/utils/supply_chain.json";

const RPC_URL: string = "http://localhost:8899";
const idl_object = JSON.parse(JSON.stringify(idl));

export const getProvider = (
  publicKey: PublicKey | null,
  signTransaction: unknown,
  sendTransaction: unknown
): Program<SupplyChain> | null => {
  if (!publicKey || !signTransaction) {
    return null;
  }
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(
    connection,
    { publicKey, signTransaction, sendTransaction } as unknown as Wallet,
    { commitment: "processed" }
  );

  return new Program<SupplyChain>(idl_object, provider);
};
