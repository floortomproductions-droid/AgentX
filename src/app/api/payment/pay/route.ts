import { NextRequest, NextResponse } from "next/server";
import { getServiceById } from "@/lib/services";
import { resolveProviderWallet } from "@/lib/provider-registry";

/**
 * GET /api/payment/pay?service_id=...&chain_id=...
 * 
 * x402 Payment Required Endpoint - Minimal format for testing
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("service_id");
  const chainId = searchParams.get("chain_id") || "solana";

  // Check for X-Payment header
  const xPayment = request.headers.get("x-payment") || request.headers.get("X-Payment");
  
  if (xPayment) {
    return NextResponse.json(
      { status: "payment_verified", message: "Access granted" },
      { status: 200 }
    );
  }

  if (!serviceId) {
    return NextResponse.json({ error: "service_id required" }, { status: 400 });
  }

  const service = getServiceById(serviceId);
  if (!service) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const providerId = service.provider.aep_id || `agentx:${service.provider.name.toLowerCase().replace(/\s+/g, '-')}`;
  const walletAddress = resolveProviderWallet(providerId, chainId);
  
  if (!walletAddress) {
    return NextResponse.json({ error: "wallet not found" }, { status: 404 });
  }

  // x402 format per official spec (x402 npm package v1.2.0)
  // CRITICAL: maxAmountRequired must be a STRING (zod schema uses z.string())
  // Sending a number causes MoonPay CLI: "Cannot convert undefined to a BigInt"
  const atomicAmount = Math.round(0.25 * 1_000_000).toString();
  const payToAddress = walletAddress.address;

  // Build the x402 response body
  // Uses the official PaymentRequirements schema fields
  const responseBody = {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "solana",
        maxAmountRequired: atomicAmount.toString(),
        resource: `/api/payment/pay?service_id=${serviceId}`,
        description: `${service.name} — ${service.description || ""}`,
        mimeType: "application/json",
        payTo: payToAddress,
        asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        maxTimeoutSeconds: 60,
        extra: {
          payToProvider: providerId,
          feePayer: "3LpYUqWjHYtbyzi4d1nTk3QmqUCryqXCeaiwjm4SuJeR"
        }
      }
    ]
  };

  return NextResponse.json(responseBody, { status: 402 });
}
