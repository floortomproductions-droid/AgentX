import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { getServiceById } from "@/lib/services";
import { resolveProviderWallet } from "@/lib/provider-registry";

/**
 * POST /api/services/browser-agent
 * 
 * Browser Agent — interact with JS-rendered pages.
 * 
 * Pricing: $0.10 per session
 */

interface InteractRequest {
  url: string;
  instructions: string;
  options?: {
    timeout?: number;
    code?: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: InteractRequest = await request.json();
    const { url, instructions, options = {} } = body;

    if (!url || !instructions) {
      return NextResponse.json(
        { error: "validation_error", message: "url and instructions are required" },
        { status: 400 }
      );
    }

    // Payment check
    const xPayment = request.headers.get("x-payment");
    const authToken = request.headers.get("authorization")?.replace("Bearer ", "");
    const isPaid = !!xPayment || !!authToken;

    if (!isPaid) {
      const walletAddress = resolveProviderWallet("agentx:agentx", "solana");

      return NextResponse.json(
        {
          x402Version: 1,
          accepts: [{
            scheme: "exact",
            network: "solana",
            maxAmountRequired: "100000", // $0.10
            resource: `/api/services/browser-agent`,
            description: `Browser Agent — ${url}`,
            mimeType: "application/json",
            payTo: walletAddress?.address || "CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9",
            asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            maxTimeoutSeconds: 60,
          }]
        },
        { status: 402 }
      );
    }

    const startTime = Date.now();
    let result: any = null;

    try {
      // Step 1: Scrape to get a scrape ID
      const scrapeCmd = `firecrawl scrape "${url}" -o /tmp/interact-scrape.md 2>&1`;
      execSync(scrapeCmd, { timeout: 20000, encoding: "utf-8" });

      // Step 2: Interact
      const timeout = options.timeout || 30;
      const language = options.code ? "--language bash" : "";
      const interactCmd = `firecrawl interact --prompt "${instructions}" --timeout ${timeout} ${language} -o /tmp/interact-result.json 2>&1`;
      execSync(interactCmd, { timeout: (timeout + 5) * 1000, encoding: "utf-8" });

      result = JSON.parse(require("fs").readFileSync("/tmp/interact-result.json", "utf-8"));
    } catch (error: any) {
      console.error("[BrowserAgent] Firecrawl error:", error.message);
      return NextResponse.json(
        { error: "interaction_failed", message: "Browser interaction failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      service_id: "browser-agent",
      status: "completed",
      url,
      instructions,
      result,
      response_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error("[BrowserAgent] Error:", error.message);
    return NextResponse.json(
      { error: "internal_error", message: error.message },
      { status: 500 }
    );
  }
}
