import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { getServiceById } from "@/lib/services";
import { resolveProviderWallet } from "@/lib/provider-registry";

/**
 * POST /api/services/site-crawler
 * 
 * Site Crawler — bulk extract content from sites.
 * 
 * Pricing: $0.03 per page, min 10 pages
 */

interface CrawlRequest {
  url: string;
  options?: {
    limit?: number;
    maxDepth?: number;
    includePaths?: string[];
    excludePaths?: string[];
    wait?: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CrawlRequest = await request.json();
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
    const isPaid = !!xPayment || !!authToken;

    if (!isPaid) {
      const walletAddress = resolveProviderWallet("agentx:agentx", "solana");
      const minPages = 10;
      const minPrice = (minPages * 0.03 * 1000000).toString(); // $0.30 USDC

      return NextResponse.json(
        {
          x402Version: 1,
          accepts: [{
            scheme: "exact",
            network: "solana",
            maxAmountRequired: minPrice,
            resource: `/api/services/site-crawler`,
            description: `Site Crawler — ${url} (min ${minPages} pages)`,
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
    let pages: any[] = [];

    try {
      const limit = options.limit || 10;
      const depth = options.maxDepth || 2;
      const includePaths = options.includePaths ? `--include-paths "${options.includePaths.join(",")}"` : "";
      const excludePaths = options.excludePaths ? `--exclude-paths "${options.excludePaths.join(",")}"` : "";
      const wait = options.wait !== false ? "--wait" : "";

      const cmd = `firecrawl crawl "${url}" --limit ${limit} --max-depth ${depth} ${includePaths} ${excludePaths} ${wait} --json -o /tmp/crawl.json 2>&1`;
      execSync(cmd, { timeout: 60000, encoding: "utf-8" });
      
      const data = JSON.parse(require("fs").readFileSync("/tmp/crawl.json", "utf-8"));
      pages = data.data || [];
    } catch (error: any) {
      console.error("[SiteCrawler] Firecrawl error:", error.message);
      return NextResponse.json(
        { error: "crawl_failed", message: "Crawl failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      service_id: "site-crawler",
      status: "completed",
      url,
      pages,
      page_count: pages.length,
      options,
      response_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error("[SiteCrawler] Error:", error.message);
    return NextResponse.json(
      { error: "internal_error", message: error.message },
      { status: 500 }
    );
  }
}
