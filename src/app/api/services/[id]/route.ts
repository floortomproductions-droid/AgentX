import { NextRequest, NextResponse } from "next/server";
import { getServiceById } from "@/lib/services";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = getServiceById(id);

  if (!service) {
    return NextResponse.json(
      {
        error: "not_found",
        message: `No service with id '${id}'`,
        request_id: "req_" + Math.random().toString(36).substring(2, 10),
      },
      { status: 404 }
    );
  }

  return NextResponse.json(service, { status: 200 });
}
