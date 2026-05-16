import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { resolveProviderWallet } from "@/lib/provider-registry";

/**
 * POST /api/services/batch-scrape
 * 
 * Batch Scrape — scrape multiple URLs concurrently.
 * 
 * Pricing: $0.03 per URL
 */

interface BatchScrapeRequest {
  urls: string[];
  options?: {
    onlyMainContent?: boolean;
    waitFor?: number;
    format?: "markdown" | "html" | "json";
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchScrapeRequest = await request.json();
    const { urls, options = {} } = body;

    // Validate
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "validation_error", message: "urls array is required" },
        { status: 400 }
      );
    }

    if (urls.length > 10) {
      return NextResponse.json(
        { error: "validation_error", message: "Maximum 10 URLs per batch" },
        { status: 400 }
      );
    }

    // Validate URLs
    for (const url of urls) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: "validation_error", message: `Invalid URL: ${url}` },
          { status: 400 }
        );
      }
    }

    // Payment check
    const xPayment = request.headers.get("x-payment");
    const authToken = request.headers.get("authorization")?.replace("Bearer ", "");
    const isPaid = !!xPayment || !!authToken;

    if (!isPaid) {
      const walletAddress = resolveProviderWallet("agentx:agentx", "solana");
      const price = (urls.length * 0.03 * 1000000).toString();

      return NextResponse.json(
        {
          x402Version: 1,
          accepts: [{
            scheme: "exact",
            network: "solana",
            maxAmountRequired: price,
            resource: `/api/services/batch-scrape`,
            description: `Batch Scrape — ${urls.length} URLs`,
            mimeType: "application/json",
            payTo: walletAddress?.address || "CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9",
            asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            maxTimeoutSeconds: 120,
          }]
        },
        { status: 402 }
      );
    }

    const startTime = Date.now();
    const results: any[] = [];

    try {
      const urlList = urls.map(u => `"${u}"`).join(" ");
      const mainContent = options.onlyMainContent ? "--only-main-content" : "";
      const waitFor = options.waitFor ? `--wait-for ${options.waitFor}` : "";
      const format = options.format === "json" ? "--format markdown,links" : "--format markdown";

      // Scrape all URLs concurrently (Firecrawl saves to .firecrawl/ dir)
      const cmd = `cd /tmp && firecrawl scrape ${urlList} ${mainContent} ${waitFor} ${format} 2>&1`;
      
      execSync(cmd, { timeout: 60000, encoding: "utf-8" });
      
      // Read results from .firecrawl/ directory
      const fs = require("fs");
      const path = require("path");
      const firecrawlDir = "/tmp/.firecrawl";
      
      if (fs.existsSync(firecrawlDir)) {
        const files = fs.readdirSync(firecrawlDir).filter((f: string) => f.endsWith(".md"));
        for (const file of files) {
          const content = fs.readFileSync(path.join(firecrawlDir, file), "utf-8");
          const url = "https://" + file.replace(".md", "");
          results.push({
            url: url,
            markdown: content,
            filename: file
          });
        }
      }

    } catch (error: any) {
      console.error("[BatchScrape] Firecrawl error:", error.message);
      return NextResponse.json(
        { error: "scrape_failed", message: "Failed to scrape URLs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      service_id: "batch-scrape",
      status: "completed",
      urls,
      results,
      result_count: results.length,
      options,
      response_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error("[BatchScrape] Error:", error.message);
    return NextResponse.json(
      { error: "internal_error", message: error.message },
      { status: 500 }
    );
  }
}
