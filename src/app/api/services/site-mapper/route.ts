import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { getServiceById } from "@/lib/services";
import { resolveProviderWallet } from "@/lib/provider-registry";
import { verifyPayment } from "@/lib/payment-verification";

/**
 * POST /api/services/site-mapper
 * 
 * Site Mapper — discover all URLs on a domain.
 * 
 * Pricing: $0.02 per domain
 */

interface MapRequest {
  url: string;
  options?: {
    limit?: number;
    includeSubdomains?: boolean;
    search?: string;
  };
}

// x402 quote for this service
const SERVICE_QUOTE = {
  maxAmountRequired: 20000, // $0.02 USDC (6 decimals)
  payTo: "CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9",
  asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

export async function POST(request: NextRequest) {
  try {
    const body: MapRequest = await request.json();
    const { url, options = {} } = body;

    if (!url) {
      return NextResponse.json(
        { error: "validation_error", message: "url is required" },
        { status: 400 }
      );
    }

    // Payment check
    const xPayment = request.headers.get("x-payment");
    const authToken = request.headers.get("authorization")?.replace("Bearer ", "");

    // If no payment header, return x402 quote
    if (!xPayment && !authToken) {
      return NextResponse.json(
        {
          x402Version: 1,
          accepts: [{
            scheme: "exact",
            network: "solana",
            maxAmountRequired: SERVICE_QUOTE.maxAmountRequired,
            resource: `/api/services/site-mapper`,
            description: `Site Mapper — ${url}`,
            mimeType: "application/json",
            payTo: SERVICE_QUOTE.payTo,
            asset: SERVICE_QUOTE.asset,
            maxTimeoutSeconds: 60,
          }]
        },
        { status: 402 }
      );
    }

    // Verify on-chain payment if x-payment header provided
    if (xPayment) {
      const verification = await verifyPayment(xPayment, SERVICE_QUOTE);
      if (!verification.valid) {
        return NextResponse.json(
          { error: "payment_required", message: verification.reason },
          { status: 402 }
        );
      }
      console.log("[SiteMapper] Payment verified:", verification.txDetails);
    }

    const startTime = Date.now();
    let urls: string[] = [];

    try {
      const limit = options.limit || 100;
      const subdomains = options.includeSubdomains ? "--include-subdomains" : "";
      const search = options.search ? `--search "${options.search}"` : "";

      const cmd = `firecrawl map "${url}" --limit ${limit} ${subdomains} ${search} --json -o /tmp/map.json 2>&1`;
      execSync(cmd, { timeout: 20000, encoding: "utf-8" });
      
      const data = JSON.parse(require("fs").readFileSync("/tmp/map.json", "utf-8"));
      const links = data.data?.links || data.data || [];
      urls = links.map((u: any) => typeof u === 'string' ? u : u.url);
    } catch (error: any) {
      console.error("[SiteMapper] Firecrawl error:", error.message);
      return NextResponse.json(
        { error: "mapping_failed", message: "Failed to map site" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      service_id: "site-mapper",
      status: "completed",
      url,
      urls,
      url_count: urls.length,
      options,
      response_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error("[SiteMapper] Error:", error.message);
    return NextResponse.json(
      { error: "internal_error", message: error.message },
      { status: 500 }
    );
  }
}
