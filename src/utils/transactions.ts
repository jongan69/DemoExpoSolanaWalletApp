import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { NETWORK } from "./constants";

const connection = new Connection(NETWORK);

export const createTransferTransaction = async (from: PublicKey, to: PublicKey) => {
  if (!from || !to) throw new Error("missing public key from user");
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: 100
    })
  );
  transaction.feePayer = from;
  const anyTransaction: any = transaction;
  anyTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return transaction;
}; 