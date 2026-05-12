import { NextRequest, NextResponse } from "next/server";
import { getAllServices, registerService } from "@/lib/services";
import { QueryParams } from "@/types/aep";

function generateRequestId(): string {
  return "req_" + Math.random().toString(36).substring(2, 10);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const params: QueryParams = {};

  const tagsParam = searchParams.get("tags");
  if (tagsParam) {
    params.tags = tagsParam.split(",").map((t) => t.trim().toLowerCase());
  }

  const protocol = searchParams.get("protocol");
  if (protocol) params.protocol = protocol.toLowerCase();

  const maxPrice = searchParams.get("max_price");
  if (maxPrice) params.max_price = parseFloat(maxPrice);

  const region = searchParams.get("region");
  if (region) params.region = region.toLowerCase();

  const category = searchParams.get("category");
  if (category) params.category = category as any;

  const minSuccessRate = searchParams.get("min_success_rate");
  if (minSuccessRate) params.min_success_rate = parseFloat(minSuccessRate);

  const limit = searchParams.get("limit");
  if (limit) params.limit = parseInt(limit);

  const offset = searchParams.get("offset");
  if (offset) params.offset = parseInt(offset);

  const result = getAllServices(params);
  const response = NextResponse.json(result, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    const requiredFields = ["name", "description", "endpoint_url"];
    const errors: string[] = [];

    for (const field of requiredFields) {
      if (!body[field]) {
        errors.push(`${field} is required`);
      }
    }

    if (!body.provider || !body.provider.name) {
      errors.push("provider.name is required");
    }

    if (!body.pricing || !body.pricing.models || body.pricing.models.length === 0) {
      errors.push("pricing.models is required with at least one model");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "validation_error", details: errors, request_id: generateRequestId() },
        { status: 400 }
      );
    }

    const service = registerService(body);
    return NextResponse.json(
      {
        service_id: service.service_id,
        status: service.status,
        verification_token: "vrf_" + Math.random().toString(36).substring(2, 15),
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        error: "validation_error",
        details: ["Invalid JSON body"],
        request_id: generateRequestId(),
      },
      { status: 400 }
    );
  }
}
