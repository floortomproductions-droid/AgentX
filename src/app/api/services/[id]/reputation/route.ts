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

  const { reputation } = service;

  // Compute decayed score (simplified: uses age in days from registered_at)
  const registered = new Date(service.registered_at).getTime();
  const now = Date.now();
  const ageDays = (now - registered) / (1000 * 60 * 60 * 24);
  const lambda = 0.001; // decay factor per day
  const decayMultiplier = Math.exp(-lambda * ageDays);
  const decayedScore = reputation.total_transactions > 0
    ? Math.round(reputation.score * decayMultiplier * 10) / 10
    : 3.0;

  return NextResponse.json(
    {
      service_id: service.service_id,
      name: service.name,
      score: reputation.score,
      total_transactions: reputation.total_transactions,
      success_rate: reputation.success_rate,
      avg_response_time_ms: reputation.avg_response_time_ms,
      dispute_ratio: reputation.dispute_ratio,
      verified_reviews: reputation.verified_reviews,
      decayed_score: decayedScore,
    },
    { status: 200 }
  );
}
