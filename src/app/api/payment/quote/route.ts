import { NextRequest, NextResponse } from "next/server";
import { getServiceById } from "@/lib/services";
import { resolveProviderWallet } from "@/lib/provider-registry";

/**
 * GET /api/payment/quote?service_id=...&chain_id=...
 * POST /api/payment/quote { service_id, chain_id }
 *
 * Returns an x402-compatible payment request for a service.
 * Resolves AgentX provider IDs to actual wallet addresses for payment.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service_id");
  const chainId = searchParams.get("chain_id") || "eip155:8453";

  return handleQuote(serviceId, chainId);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service_id, chain_id } = body;
    return handleQuote(service_id, chain_id || "eip155:8453");
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "Expected JSON body with service_id and optional chain_id" },
      { status: 400 }
    );
  }
}

function handleQuote(serviceId: string | null, chainId: string) {
  if (!serviceId) {
    return NextResponse.json(
      { error: "invalid_request", message: "service_id is required" },
      { status: 400 }
    );
  }

  const service = getServiceById(serviceId);
  if (!service) {
    return NextResponse.json(
      { error: "not_found", message: `No service with id '${serviceId}'` },
      { status: 404 }
    );
  }

  // Resolve AgentX provider ID to actual wallet address
  const providerId = service.provider.agentx_id || service.provider.aep_id || `agentx:${service.provider.name.toLowerCase().replace(/\s+/g, '-')}`;
  const walletAddress = resolveProviderWallet(providerId, chainId);
  
  if (!walletAddress) {
    return NextResponse.json(
      { 
        error: "wallet_not_found", 
        message: `No wallet registered for provider '${providerId}' on chain '${chainId}'`,
        provider_id: providerId,
        chain_id: chainId
      },
      { status: 404 }
    );
  }

  // Pick a USDC pricing model, fallback to cheapest
  const usdcModel = service.pricing.models.find(
    (m) => m.currency === "USDC"
  );
  const fallbackModel = service.pricing.models.sort(
    (a, b) => a.unit_price - b.unit_price
  )[0];
  const pricingModel = usdcModel || fallbackModel;

  // Build x402 payload with actual wallet address
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry

  const x402Payload = {
    scheme: "x402",
    version: "0.1",
    network: chainId,
    maxPriceRequired: pricingModel.unit_price,
    currency: pricingModel.currency,
    currentPrice: pricingModel.unit_price,
    currentPriceUSD: pricingModel.currency === "USD" ? pricingModel.unit_price : pricingModel.unit_price * 1.001, // ~exchange rate
    resource: {
      name: service.name,
      description: service.description,
      url: service.endpoint_url,
    },
    payTo: walletAddress.address, // <-- RESOLVED TO ACTUAL WALLET ADDRESS
    payToProvider: providerId, // <-- Keep provider ID for reference
    mimeType: "application/json",
    outputSchema: "openai-chat-completion-response-v1",
    expiresAt,
    metadata: {
      service_id: service.service_id,
      provider: service.provider.name,
      unit: pricingModel.unit,
      chain_id: chainId,
      provider_id: providerId,
      ...(walletAddress.destinationTag ? { destination_tag: walletAddress.destinationTag } : {}),
    },
  };

  return NextResponse.json(
    {
      service_id: service.service_id,
      service_name: service.name,
      provider: service.provider.name,
      amount: pricingModel.unit_price,
      currency: pricingModel.currency,
      chain_id: chainId,
      provider_id: providerId,
      recipient_address: walletAddress.address, // <-- EXPOSE RESOLVED ADDRESS
      ...(walletAddress.destinationTag ? { destination_tag: walletAddress.destinationTag } : {}),
      expires_at: expiresAt,
      x402_payload: x402Payload,
    },
    { status: 200 }
  );
}
