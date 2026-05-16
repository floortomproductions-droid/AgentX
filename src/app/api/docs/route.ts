import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/docs
 *
 * AgentX API Documentation
 *
 * Returns a machine-readable OpenAPI-style spec for agents.
 */

export async function GET(request: NextRequest) {
  const baseUrl = "https://agentx.sale";

  const docs = {
    name: "AgentX Marketplace",
    version: "0.2.0",
    protocol: "AEP",
    base_url: baseUrl,
    description:
      "AgentX is the open marketplace where AI agents discover, compare, and transact with verified service providers via x402 crypto payments.",
    authentication: {
      type: "x402",
      description:
        "All services require x402 payment in USDC on Solana. See x402.org for protocol details.",
    },
    endpoints: [
      {
        path: "/api/challenge",
        method: "GET",
        description: "Get a proof-of-work challenge for agent authentication",
        response: {
          challenge_id: "string",
          data: "string (hash input)",
          prefix: "string (target prefix)",
          difficulty: "number",
          algorithm: "SHA256",
          expires_at: "ISO timestamp",
          instructions: "string",
        },
      },
      {
        path: "/api/challenge",
        method: "POST",
        description: "Submit PoW solution and receive session token",
        request_body: {
          challenge_id: "string",
          data: "string",
          nonce: "number",
          prefix: "string",
          hash: "string",
        },
        response: {
          status: "verified",
          session_token: "string",
          valid_until: "ISO timestamp",
        },
      },
      {
        path: "/api/services",
        method: "GET",
        description: "List all active services",
        query_params: {
          limit: "number (default 20)",
          offset: "number",
          category: "string",
          protocol: "string",
          max_price: "number",
          tags: "comma-separated strings",
        },
        response: {
          query: "object",
          results: "array of ServiceListing",
          total: "number",
          page: "number",
        },
      },
      {
        path: "/api/services/{id}",
        method: "GET",
        description: "Get details for a specific service",
        example: "/api/services/web-extract",
        response: "ServiceListing",
      },
      {
        path: "/api/services/{id}",
        method: "POST",
        description: "Call a service (requires x402 payment)",
        headers: {
          "Content-Type": "application/json",
          "x-payment": "Solana transaction signature",
        },
        payment_flow: [
          "1. POST to service without x-payment → receive 402 with quote",
          "2. Pay USDC on-chain to payTo address for maxAmountRequired",
          "3. POST again with x-payment: <tx-signature>",
          "4. Receive service response",
        ],
      },
      {
        path: "/api/health",
        method: "GET",
        description: "Health check",
        response: {
          status: "healthy",
          version: "string",
          protocol: "AEP",
          services_count: "number",
        },
      },
    ],
    services: [
      {
        id: "web-extract",
        name: "Web Extract",
        price: "$0.03 USDC per page",
        description: "Scrape any URL and return clean markdown",
        endpoint: "/api/services/web-extract",
        input: { url: "string" },
        output: { content: "markdown string" },
      },
      {
        id: "web-search",
        name: "Web Search",
        price: "$0.02 USDC per query ($0.05 with scrape)",
        description: "Search the web with optional content extraction",
        endpoint: "/api/services/web-search",
        input: { query: "string", options: { limit: "number", scrape: "boolean" } },
        output: { results: "array" },
      },
      {
        id: "site-mapper",
        name: "Site Mapper",
        price: "$0.02 USDC per domain",
        description: "Discover all URLs on a website",
        endpoint: "/api/services/site-mapper",
        input: { url: "string", options: { limit: "number" } },
        output: { urls: "array of strings" },
      },
      {
        id: "browser-agent",
        name: "Browser Agent",
        price: "$0.10 USDC per session",
        description: "Interact with JavaScript-rendered pages",
        endpoint: "/api/services/browser-agent",
        input: { url: "string", instructions: "string" },
        output: { result: "object" },
      },
      {
        id: "batch-scrape",
        name: "Batch Scrape",
        price: "$0.03 USDC per URL (max 10)",
        description: "Scrape multiple URLs concurrently",
        endpoint: "/api/services/batch-scrape",
        input: { urls: "array of strings (max 10)" },
        output: { results: "array of markdown objects" },
      },
    ],
    example_flow: {
      step_1_challenge: "GET /api/challenge",
      step_2_solve: "Find nonce where SHA256(data + nonce) starts with prefix",
      step_3_verify: "POST /api/challenge with {challenge_id, data, nonce, prefix, hash}",
      step_4_discover: "GET /api/services",
      step_5_get_quote: "POST /api/services/web-extract without payment → 402 with x402 quote",
      step_6_pay:
        "Transfer USDC on Solana to payTo address for maxAmountRequired",
      step_7_call: "POST /api/services/web-extract with x-payment: <tx-signature>",
    },
    support: {
      email: "info@agentx.sale",
      protocol: "https://aeprotocol.com",
    },
  };

  const response = NextResponse.json(docs, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}
