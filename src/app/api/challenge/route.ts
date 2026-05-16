import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * GET /api/challenge
 * Returns a PoW challenge for the agent to solve.
 * 
 * Response includes:
 *   - data: random hex string to hash
 *   - prefix: required leading zeros (difficulty)
 *   - expires_at: challenge validity window
 * 
 * Agent must find nonce where SHA256(data + nonce) starts with prefix.
 */
export async function GET(request: NextRequest) {
  // Generate random challenge data (32 hex chars = 16 bytes)
  const challengeData = crypto.randomBytes(16).toString("hex");
  
  // Difficulty: 4 leading zeros (adjustable based on load)
  const prefix = "0000";
  
  // Challenge expires in 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  
  // Create a session ID to track this challenge
  const sessionId = crypto.randomBytes(8).toString("hex");
  
  return NextResponse.json({
    challenge_id: sessionId,
    data: challengeData,
    prefix: prefix,
    difficulty: prefix.length,
    algorithm: "SHA256",
    expires_at: expiresAt,
    instructions: `Find nonce where SHA256("${challengeData}" + nonce) starts with "${prefix}"`,
  }, { status: 200 });
}

/**
 * POST /api/challenge
 * Verifies a PoW solution submitted by an agent.
 * 
 * Body: { challenge_id, data, nonce, prefix }
 * 
 * Returns session token on success, error on failure.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challenge_id, data, nonce, prefix } = body;
    
    // Validate required fields
    if (!challenge_id || !data || nonce === undefined || !prefix) {
      return NextResponse.json(
        { error: "invalid_request", message: "Missing required fields: challenge_id, data, nonce, prefix" },
        { status: 400 }
      );
    }
    
    // Validate nonce is a number
    if (typeof nonce !== "number" && !/^\d+$/.test(String(nonce))) {
      return NextResponse.json(
        { error: "invalid_nonce", message: "Nonce must be a non-negative integer" },
        { status: 400 }
      );
    }
    
    const nonceNum = Number(nonce);
    
    // Compute hash: SHA256(data + nonce)
    const input = `${data}${nonceNum}`;
    const hash = crypto.createHash("sha256").update(input).digest("hex");
    
    // Check if hash starts with required prefix
    if (!hash.startsWith(prefix)) {
      return NextResponse.json(
        { 
          status: "failed", 
          reason: "invalid_solution", 
          message: `Hash does not start with "${prefix}"`,
          submitted_hash: hash,
          expected_prefix: prefix,
        },
        { status: 200 }
      );
    }
    
    // Success! Generate session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const validUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour session
    
    return NextResponse.json({
      status: "verified",
      message: "Proof-of-work accepted",
      session_token: sessionToken,
      valid_until: validUntil,
      challenge_id: challenge_id,
      nonce_found: nonceNum,
      hash: hash,
    }, { status: 200 });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: "invalid_request", message: "Expected JSON body with challenge solution" },
      { status: 400 }
    );
  }
}
