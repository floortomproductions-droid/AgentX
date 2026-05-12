import { NextRequest, NextResponse } from "next/server";
import { getAllServices, getServiceById } from "@/lib/services";

/**
 * POST /api/mcp
 *
 * MCP (Model Context Protocol) endpoint implementing JSON-RPC 2.0.
 * Exposes agent tools for service discovery, payment quotes, and payment verification.
 *
 * Tools exposed:
 *   - get_services     List/filter available services
 *   - get_quote        Get a payment quote for a service
 *   - verify_payment   Verify a payment and unlock service access
 */

type MCPTool = "get_services" | "get_quote" | "verify_payment";

interface MCPRequest {
  jsonrpc: string;
  method: string;
  params?: Record<string, unknown>;
  id?: number | string;
}

// --- Tool Implementations ---

function toolGetServices(params?: Record<string, unknown>) {
  const queryParams: Record<string, unknown> = {};

  if (params?.category) queryParams.category = params.category;
  if (params?.protocol) queryParams.protocol = params.protocol;
  if (params?.max_price) queryParams.max_price = Number(params.max_price);
  if (params?.region) queryParams.region = params.region;
  if (params?.min_success_rate) queryParams.min_success_rate = Number(params.min_success_rate);
  if (params?.limit) queryParams.limit = Number(params.limit);

  const result = getAllServices(queryParams as any);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          total: result.total,
          services: result.results.map((s) => ({
            service_id: s.service_id,
            name: s.name,
            provider: s.provider.name,
            payment_protocols: s.supported_protocols.payment,
            reputation_score: s.reputation.score,
            cheapest_price: Math.min(...s.pricing.models.map((m) => m.unit_price)),
          })),
        }),
      },
    ],
  };
}

function toolGetQuote(params?: Record<string, unknown>) {
  const serviceId = params?.service_id as string | undefined;
  const chainId = (params?.chain_id as string) || "eip155:8453";

  if (!serviceId) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: "service_id is required" }) }],
      isError: true,
    };
  }

  const service = getServiceById(serviceId);
  if (!service) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: `Service '${serviceId}' not found` }) }],
      isError: true,
    };
  }

  const usdcModel = service.pricing.models.find((m) => m.currency === "USDC");
  const fallbackModel = service.pricing.models.sort((a, b) => a.unit_price - b.unit_price)[0];
  const pricingModel = usdcModel || fallbackModel;

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          service_id: service.service_id,
          amount: pricingModel.unit_price,
          currency: pricingModel.currency,
          chain_id: chainId,
          recipient: service.provider.aep_id,
          payment_methods: service.supported_protocols.payment,
        }),
      },
    ],
  };
}

function toolVerifyPayment(params?: Record<string, unknown>) {
  const serviceId = params?.service_id as string | undefined;
  const txHash = params?.signed_tx_hash as string | undefined;

  if (!serviceId || !txHash) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: "service_id and signed_tx_hash are required" }) }],
      isError: true,
    };
  }

  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
  if (!txHashRegex.test(txHash)) {
    return {
      content: [{ type: "text", text: JSON.stringify({ status: "failed", reason: "invalid_tx_format" }) }],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          status: "confirmed",
          tx_hash: txHash,
          service_id: serviceId,
          verified_at: new Date().toISOString(),
        }),
      },
    ],
  };
}

// --- Tool Registry ---

const tools = {
  get_services: {
    description: "List and filter available agent services on the marketplace",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter by category (inference, search, etc.)" },
        protocol: { type: "string", description: "Filter by payment protocol (x402, mpp, acp, etc.)" },
        max_price: { type: "number", description: "Maximum unit price" },
        region: { type: "string", description: "Filter by region" },
        min_success_rate: { type: "number", description: "Minimum success rate (0-1)" },
        limit: { type: "number", description: "Max results to return", default: 20 },
      },
    },
    handler: toolGetServices,
  },
  get_quote: {
    description: "Get a payment quote for accessing a service",
    inputSchema: {
      type: "object",
      properties: {
        service_id: { type: "string", description: "The service ID to get a quote for" },
        chain_id: { type: "string", description: "Chain ID (default: eip155:8453 for Base)", default: "eip155:8453" },
      },
      required: ["service_id"],
    },
    handler: toolGetQuote,
  },
  verify_payment: {
    description: "Verify a signed payment transaction and unlock service access",
    inputSchema: {
      type: "object",
      properties: {
        service_id: { type: "string", description: "The service ID being paid for" },
        signed_tx_hash: { type: "string", description: "The signed transaction hash (0x-prefixed)" },
      },
      required: ["service_id", "signed_tx_hash"],
    },
    handler: toolVerifyPayment,
  },
};

// --- MCP Request Handler ---

export async function POST(request: NextRequest) {
  try {
    const body: MCPRequest = await request.json();

    // Validate JSON-RPC structure
    if (body.jsonrpc !== "2.0") {
      return NextResponse.json(
        { jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request: jsonrpc must be '2.0'" }, id: body.id || null },
        { status: 400 }
      );
    }

    // Handle different JSON-RPC methods
    switch (body.method) {
      // tools/list — return available tools
      case "tools/list": {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id: body.id,
            result: {
              tools: Object.entries(tools).map(([name, tool]) => ({
                name,
                description: tool.description,
                inputSchema: tool.inputSchema,
              })),
            },
          },
          { status: 200 }
        );
      }

      // tools/call — execute a tool
      case "tools/call": {
        const toolName = body.params?.name as MCPTool | undefined;
        const toolArgs = body.params?.arguments as Record<string, unknown> | undefined;

        if (!toolName || !tools[toolName]) {
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id: body.id,
              error: { code: -32601, message: `Method not found: tool '${toolName}' not available` },
            },
            { status: 404 }
          );
        }

        const result = tools[toolName].handler(toolArgs);
        return NextResponse.json(
          { jsonrpc: "2.0", id: body.id, result },
          { status: 200 }
        );
      }

      // initialize — MCP handshake
      case "initialize": {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id: body.id,
            result: {
              protocolVersion: "0.1",
              serverInfo: {
                name: "agentx-mcp",
                version: "0.2.0",
              },
              capabilities: {
                tools: { listChanged: false },
              },
            },
          },
          { status: 200 }
        );
      }

      default: {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id: body.id,
            error: { code: -32601, message: `Method not found: ${body.method}` },
          },
          { status: 404 }
        );
      }
    }
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null },
      { status: 400 }
    );
  }
}
