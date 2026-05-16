import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { getServiceById } from "@/lib/services";
import { resolveProviderWallet } from "@/lib/provider-registry";

/**
 * POST /api/services/web-search
 * 
 * Web Search service — search the web with optional content extraction.
 * 
 * Pricing: $0.02 per query | $0.05 with scrape
 */

interface SearchRequest {
  query: string;
  options?: {
    limit?: number;
    scrape?: boolean;
    sources?: "web" | "news" | "images";
    timeFilter?: "h" | "d" | "w" | "m" | "y";
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, options = {} } = body;

    if (!query) {
      return NextResponse.json(
        { error: "validation_error", message: "query is required" },
        { status: 400 }
      );
    }

    // Payment check
    const xPayment = request.headers.get("x-payment");
    const authToken = request.headers.get("authorization")?.replace("Bearer ", "");
    const isPaid = !!xPayment || !!authToken;

    if (!isPaid) {
      const service = getServiceById("web-search");
      const walletAddress = resolveProviderWallet("agentx:agentx", "solana");
      const price = options.scrape ? "50000" : "20000"; // $0.05 or $0.02

      return NextResponse.json(
        {
          x402Version: 1,
          accepts: [{
            scheme: "exact",
            network: "solana",
            maxAmountRequired: price,
            resource: `/api/services/web-search`,
            description: `Web Search${options.scrape ? " + Scrape" : ""} — ${query.substring(0, 50)}...`,
            mimeType: "application/json",
            payTo: walletAddress?.address || "CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9",
            asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            maxTimeoutSeconds: 60,
          }]
        },
        { status: 402 }
      );
    }

    // Call Firecrawl search
    const startTime = Date.now();
    let results: any[] = [];

    try {
      const limit = options.limit || 5;
      const sources = options.sources || "web";
      const timeFilter = options.timeFilter ? `--tbs qdr:${options.timeFilter}` : "";
      const scrape = options.scrape ? "--scrape" : "";

      const cmd = `firecrawl search "${query}" --limit ${limit} --sources ${sources} ${timeFilter} ${scrape} --json -o /tmp/search.json 2>&1`;
      execSync(cmd, { timeout: 30000, encoding: "utf-8" });
      
      const data = JSON.parse(require("fs").readFileSync("/tmp/search.json", "utf-8"));
      results = data.data?.web || data.data || [];
    } catch (error: any) {
      console.error("[WebSearch] Firecrawl error:", error.message);
      return NextResponse.json(
        { error: "search_failed", message: "Search failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      service_id: "web-search",
      status: "completed",
      query,
      results,
      result_count: results.length,
      options,
      response_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error("[WebSearch] Error:", error.message);
    return NextResponse.json(
      { error: "internal_error", message: error.message },
      { status: 500 }
    );
  }
}
