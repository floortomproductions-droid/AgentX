const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, createTransferCheckedInstruction } = require('@solana/spl-token');

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const SENDER = new PublicKey('3LpYUqWjHYtbyzi4d1nTk3QmqUCryqXCeaiwjm4SuJeR');
const RECIPIENT = new PublicKey('CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9');
const AMOUNT = 100000; // $0.10 USDC

async function createTransaction() {
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
  const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection, null, USDC_MINT, SENDER
  );
  
  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection, null, USDC_MINT, RECIPIENT
  );
  
  const transferInstruction = createTransferCheckedInstruction(
    senderTokenAccount.address,
    USDC_MINT,
    recipientTokenAccount.address,
    SENDER,
    AMOUNT,
    6
  );
  
  const transaction = new Transaction().add(transferInstruction);
  transaction.feePayer = SENDER;
  
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  
  const serialized = transaction.serialize({ requireAllSignatures: false });
  const base64 = serialized.toString('base64');
  
  console.log(base64);
}

createTransaction().catch(console.error);
