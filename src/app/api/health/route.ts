import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      version: "0.2.0",
      protocol: "AEP",
      uptime: "Service Registry operational",
      timestamp: new Date().toISOString(),
      services_count: 8,
    },
    { status: 200 }
  );
}
