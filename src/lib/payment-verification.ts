import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

/**
 * x402 Payment Verification Module
 * 
 * Verifies Solana USDC transfers for AgentX services.
 * 
 * Flow:
 * 1. Agent receives 402 quote with payTo address and amount
 * 2. Agent creates and signs Solana USDC transfer tx
 * 3. Agent sends tx signature in x-payment header
 * 4. We verify: tx exists, is confirmed, recipient matches, amount >= required
 */

// USDC mint address on Solana mainnet
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Connection to Solana (use Helius or QuickNode for production)
const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

interface X402Quote {
  maxAmountRequired: number;
  payTo: string;
  asset: string;
}

interface PaymentVerification {
  valid: boolean;
  reason?: string;
  txDetails?: {
    signature: string;
    amount: number;
    recipient: string;
    timestamp: number;
    confirmations: number;
  };
}

/**
 * Verify a payment transaction on Solana
 * @param txSignature - The Solana transaction signature
 * @param quote - The x402 quote that was presented to the agent
 * @returns PaymentVerification result
 */
export async function verifyPayment(
  txSignature: string,
  quote: X402Quote
): Promise<PaymentVerification> {
  try {
    // Validate signature format
    if (!txSignature || txSignature.length < 64) {
      return { valid: false, reason: "Invalid transaction signature format" };
    }

    // Connect to Solana
    const connection = new Connection(SOLANA_RPC, "confirmed");

    // Fetch transaction
    const tx = await connection.getTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { valid: false, reason: "Transaction not found on chain" };
    }

    if (tx.meta?.err) {
      return { valid: false, reason: "Transaction failed" };
    }

    // Verify timestamp (not too old)
    const now = Date.now() / 1000;
    const txTime = tx.blockTime || 0;
    if (now - txTime > 300) {
      return { valid: false, reason: "Transaction too old (>5 minutes)" };
    }

    // Parse token transfers from transaction
    const transfers = parseTokenTransfers(tx);
    
    // Find transfer matching our requirements
    const matchingTransfer = transfers.find((t) => {
      return (
        t.mint === quote.asset &&
        t.recipient === quote.payTo &&
        t.amount >= quote.maxAmountRequired
      );
    });

    if (!matchingTransfer) {
      return {
        valid: false,
        reason: `No matching transfer found. Required: ${quote.maxAmountRequired} ${quote.asset} to ${quote.payTo}`,
      };
    }

    return {
      valid: true,
      txDetails: {
        signature: txSignature,
        amount: matchingTransfer.amount,
        recipient: matchingTransfer.recipient,
        timestamp: txTime,
        confirmations: tx.slot ? 1 : 0,
      },
    };
  } catch (error: any) {
    console.error("[PaymentVerification] Error:", error.message);
    return { valid: false, reason: `Verification error: ${error.message}` };
  }
}

/**
 * Parse token transfers from a Solana transaction
 */
function parseTokenTransfers(tx: any): Array<{
  mint: string;
  recipient: string;
  amount: number;
}> {
  const transfers: Array<{ mint: string; recipient: string; amount: number }> = [];

  if (!tx.meta?.postTokenBalances || !tx.meta?.preTokenBalances) {
    return transfers;
  }

  // Compare pre and post balances to find transfers
  const preBalances = new Map(
    tx.meta.preTokenBalances.map((b: any) => [
      `${b.accountIndex}-${b.mint}`,
      parseInt(b.uiTokenAmount.amount),
    ])
  );

  for (const post of tx.meta.postTokenBalances) {
    const key = `${post.accountIndex}-${post.mint}`;
    const preAmount = preBalances.get(key) || 0;
    const postAmount = parseInt(post.uiTokenAmount.amount);
    const delta = postAmount - Number(preAmount);

    if (delta > 0) {
      transfers.push({
        mint: post.mint,
        recipient: post.owner,
        amount: delta,
      });
    }
  }

  return transfers;
}

/**
 * Simple payment check for endpoints
 * Returns true if payment is valid, false otherwise
 */
export async function isPaymentValid(
  txSignature: string | null,
  quote: X402Quote
): Promise<{ valid: boolean; reason?: string }> {
  if (!txSignature) {
    return { valid: false, reason: "No payment provided" };
  }

  const result = await verifyPayment(txSignature, quote);
  return { valid: result.valid, reason: result.reason };
}
