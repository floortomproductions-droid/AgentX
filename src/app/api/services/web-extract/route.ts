import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { getServiceById } from "@/lib/services";
import { resolveProviderWallet } from "@/lib/provider-registry";

/**
 * POST /api/services/web-extract
 * 
 * Web Extract service — scrape any URL and return clean markdown.
 * 
 * Flow:
 * 1. Validate request (URL required)
 * 2. Check payment (x402 header or session token)
 * 3. Call Firecrawl to extract content
 * 4. Return markdown
 * 
 * Pricing: $0.03 USDC per page
 */

interface ExtractRequest {
  url: string;
  options?: {
    onlyMainContent?: boolean;
    waitFor?: number;
    format?: "markdown" | "html" | "json";
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtractRequest = await request.json();
    const { url, options = {} } = body;

    // Validate URL
    if (!url) {
      return NextResponse.json(
        { error: "validation_error", message: "url is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "validation_error", message: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Check for payment header (x402) or session token
    const xPayment = request.headers.get("x-payment");
    const authToken = request.headers.get("authorization")?.replace("Bearer ", "");
    
    // For now: accept if either present (payment verification happens upstream)
    // In production: verify x402 payment against on-chain state
    const isPaid = !!xPayment || !!authToken;
    
    if (!isPaid) {
      // Return x402 payment required
      const service = getServiceById("web-extract");
      if (!service) {
        return NextResponse.json(
          { error: "service_not_found" },
          { status: 404 }
        );
      }

      const providerId = service.provider.agentx_id || "agentx:agentx";
      const walletAddress = resolveProviderWallet(providerId, "solana");
      
      return NextResponse.json(
        {
          x402Version: 1,
          accepts: [{
            scheme: "exact",
            network: "solana",
            maxAmountRequired: 30000, // $0.03 USDC (6 decimals)
            resource: `/api/services/web-extract`,
            description: `${service.name} — ${service.description?.substring(0, 100)}...`,
            mimeType: "application/json",
            payTo: walletAddress?.address || "CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9",
            asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            maxTimeoutSeconds: 60,
          }]
        },
        { status: 402 }
      );
    }

    // Call Firecrawl to extract content
    const startTime = Date.now();
    let markdown: string;
    
    // Set API key for CLI
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "config_error", message: "FIRECRAWL_API_KEY not configured" },
        { status: 500 }
      );
    }
    
    try {
      const cmd = `FIRECRAWL_API_KEY=${apiKey} firecrawl scrape "${url}" --format markdown ${options.onlyMainContent ? "--only-main-content" : ""} ${options.waitFor ? `--wait-for ${options.waitFor}` : ""} -o /tmp/extract.md 2>&1`;
      execSync(cmd, { timeout: 30000, encoding: "utf-8" });
      markdown = require("fs").readFileSync("/tmp/extract.md", "utf-8");
    } catch (error: any) {
      console.error("[WebExtract] Firecrawl error:", error.message);
      return NextResponse.json(
        { error: "extraction_failed", message: "Failed to extract content from URL" },
        { status: 500 }
      );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      service_id: "web-extract",
      status: "completed",
      url,
      content: markdown,
      format: options.format || "markdown",
      response_time_ms: responseTime,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error("[WebExtract] Error:", error.message);
    return NextResponse.json(
      { error: "internal_error", message: error.message },
      { status: 500 }
    );
  }
}
