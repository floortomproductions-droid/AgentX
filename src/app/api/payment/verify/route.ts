import { NextRequest, NextResponse } from "next/server";
import { getServiceById } from "@/lib/services";

/**
 * Multi-chain payment verification for AgentX
 * Supports: solana, ethereum, base, bitcoin
 */

interface VerificationResult {
  status: "confirmed" | "failed";
  tx_hash: string;
  service_id: string;
  service_name?: string;
  provider?: string;
  chain_id?: string;
  agent_id?: string | null;
  verified_at?: string;
  block_time?: number;
  block_height?: number;
  recipient?: string;
  amount_paid?: number;
  fee?: number;
  fee_unit?: string;
  message: string;
  reason?: string;
  error?: any;
}

async function verifySolana(txHash: string): Promise<Partial<VerificationResult>> {
  const rpcResponse = await fetch('https://api.mainnet-beta.solana.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTransaction',
      params: [txHash, { encoding: 'json', commitment: 'confirmed', maxSupportedTransactionVersion: 0 }]
    })
  });

  const rpcData = await rpcResponse.json();
  
  if (rpcData.error) {
    return { status: "failed", reason: "rpc_error", message: `Solana RPC error: ${rpcData.error.message}` };
  }
  
  if (!rpcData.result) {
    return { status: "failed", reason: "tx_not_found", message: "Transaction not found on Solana blockchain" };
  }

  const tx = rpcData.result;
  const meta = tx.meta;
  
  if (meta.err) {
    return { status: "failed", reason: "tx_failed", message: "Transaction failed on-chain", error: meta.err };
  }

  // Calculate USDC amount from token balance changes
  let amount = 0;
  if (meta.postTokenBalances && meta.preTokenBalances && meta.postTokenBalances[0] && meta.preTokenBalances[0]) {
    const postBalance = meta.postTokenBalances[0].uiTokenAmount?.uiAmount || 0;
    const preBalance = meta.preTokenBalances[0].uiTokenAmount?.uiAmount || 0;
    amount = Math.abs(postBalance - preBalance);
  }

  return {
    status: "confirmed",
    block_time: tx.blockTime,
    block_height: tx.slot,
    recipient: tx.transaction.message.accountKeys[1]?.pubkey || "unknown",
    amount_paid: amount,
    fee: meta.fee / 1e9,
    fee_unit: "SOL",
    message: "Payment verified on Solana"
  };
}

async function verifyEthereum(txHash: string, rpcUrl: string = 'https://eth.llamarpc.com'): Promise<Partial<VerificationResult>> {
  const rpcResponse = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionReceipt',
      params: [txHash]
    })
  });

  const rpcData = await rpcResponse.json();
  
  if (rpcData.error) {
    return { status: "failed", reason: "rpc_error", message: `ETH RPC error: ${rpcData.error.message}` };
  }
  
  if (!rpcData.result) {
    return { status: "failed", reason: "tx_not_found", message: "Transaction not found on Ethereum" };
  }

  const receipt = rpcData.result;
  
  if (receipt.status !== '0x1') {
    return { status: "failed", reason: "tx_failed", message: "Transaction failed on-chain" };
  }

  // Get block details for timestamp
  const blockResponse = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBlockByNumber',
      params: [receipt.blockNumber, false]
    })
  });
  
  const blockData = await blockResponse.json();
  const blockTime = blockData.result ? parseInt(blockData.result.timestamp, 16) : null;

  return {
    status: "confirmed",
    block_time: blockTime || undefined,
    block_height: parseInt(receipt.blockNumber, 16),
    recipient: receipt.to,
    amount_paid: parseInt(receipt.value, 16) / 1e18,
    fee: (parseInt(receipt.gasUsed, 16) * parseInt(receipt.effectiveGasPrice, 16)) / 1e18,
    fee_unit: "ETH",
    message: "Payment verified on Ethereum"
  };
}

async function verifyBase(txHash: string): Promise<Partial<VerificationResult>> {
  // Base uses Ethereum-compatible RPC
  return verifyEthereum(txHash, 'https://base.llamarpc.com');
}

async function verifyBitcoin(txHash: string): Promise<Partial<VerificationResult>> {
  // Use mempool.space API for Bitcoin
  const response = await fetch(`https://mempool.space/api/tx/${txHash}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      return { status: "failed", reason: "tx_not_found", message: "Transaction not found on Bitcoin blockchain" };
    }
    return { status: "failed", reason: "rpc_error", message: `Bitcoin API error: ${response.status}` };
  }

  const tx = await response.json();
  
  if (!tx.status?.confirmed) {
    return { status: "failed", reason: "not_confirmed", message: "Transaction not yet confirmed" };
  }

  // Calculate amount from outputs
  const amount = tx.vout.reduce((sum: number, out: any) => sum + (out.value || 0), 0) / 1e8;

  return {
    status: "confirmed",
    block_time: tx.status?.block_time ? Math.floor(tx.status.block_time) : undefined,
    block_height: tx.status?.block_height,
    recipient: tx.vout[0]?.scriptpubkey_address || "unknown",
    amount_paid: amount,
    fee: (tx.fee || 0) / 1e8,
    fee_unit: "BTC",
    message: "Payment verified on Bitcoin"
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service_id, signed_tx_hash, chain_id, x402_payload, agent_id } = body;

    // --- Validate required fields ---
    if (!service_id) {
      return NextResponse.json(
        { error: "validation_error", message: "service_id is required" },
        { status: 400 }
      );
    }

    if (!signed_tx_hash) {
      return NextResponse.json(
        { error: "validation_error", message: "signed_tx_hash is required" },
        { status: 400 }
      );
    }

    // Verify service exists
    const service = getServiceById(service_id);
    if (!service) {
      return NextResponse.json(
        { error: "not_found", message: `No service with id '${service_id}'` },
        { status: 404 }
      );
    }

    // --- Route to correct chain verifier ---
    const chain = chain_id || "solana";
    let result: Partial<VerificationResult>;

    try {
      switch (chain.toLowerCase()) {
        case "solana":
        case "eip155:501": // CAIP-2 for Solana
          result = await verifySolana(signed_tx_hash);
          break;
        
        case "ethereum":
        case "eth":
        case "eip155:1":
          result = await verifyEthereum(signed_tx_hash);
          break;
        
        case "base":
        case "eip155:8453":
          result = await verifyBase(signed_tx_hash);
          break;
        
        case "bitcoin":
        case "btc":
          result = await verifyBitcoin(signed_tx_hash);
          break;
        
        default:
          return NextResponse.json({
            status: "failed",
            reason: "unsupported_chain",
            message: `Chain '${chain}' is not yet supported for verification`,
            supported_chains: ["solana", "ethereum", "base", "bitcoin"]
          }, { status: 200 });
      }
    } catch (error: any) {
      console.error(`[PAYMENT] Verification error for ${chain}:`, error);
      return NextResponse.json({
        status: "failed",
        reason: "verification_error",
        message: `Verification failed: ${error.message}`,
        service_id: service.service_id,
        tx_hash: signed_tx_hash,
      }, { status: 200 });
    }

    // Build final response
    const response: VerificationResult = {
      ...result,
      tx_hash: signed_tx_hash,
      service_id: service.service_id,
      service_name: service.name,
      provider: service.provider.name,
      chain_id: chain,
      agent_id: agent_id || null,
      verified_at: new Date().toISOString(),
    } as VerificationResult;

    console.log(`[PAYMENT] ${result.status?.toUpperCase()} tx ${signed_tx_hash} for ${service_id} on ${chain}`);
    if (result.status === "confirmed") {
      console.log(`[PAYMENT] Amount: ${result.amount_paid}, Recipient: ${result.recipient}`);
    }

    return NextResponse.json(response, { status: 200 });

  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "Expected JSON body with service_id and signed_tx_hash" },
      { status: 400 }
    );
  }
}
