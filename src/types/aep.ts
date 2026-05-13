// AE Protocol v0.3 — TypeScript types matching the Service Registry Schema

export type ServiceStatus = "active" | "paused" | "deprecated";

export type Currency = "USD" | "EUR" | "GBP" | "USDC" | "BTC";

export type PricingModelType = "per_call" | "bulk" | "subscription" | "negotiated";

export type PaymentProtocol = "mpp" | "acp" | "ucp" | "x402" | "ap2";
export type CommunicationProtocol = "mcp" | "a2a" | "webmcp";
export type IdentityProtocol = "fluxa" | "verifiable-intent" | "ace";

export type Category = "inference" | "image-generation" | "search" | "data-enrichment";

export type Region = "global" | "us-east" | "eu-west" | "ap-southeast";

export type SubscriptionInterval = "monthly" | "yearly";

export interface Provider {
  agentx_id?: string;
  name: string;
  url: string;
  aep_id: string;
  contact: string;
}

export interface PricingModel {
  type: PricingModelType;
  currency: Currency;
  unit: string;
  unit_price: number;
  min_commitment?: number;
  max_commitment?: number;
  subscription_interval?: SubscriptionInterval;
  subscription_price?: number;
}

export interface SLA {
  name: string;
  uptime_pct: number;
  latency_ms: number;
  quality_threshold?: string;
  price_premium_pct: number;
  refund_policy: string;
}

export interface SupportedProtocols {
  payment: PaymentProtocol[];
  communication: CommunicationProtocol[];
  identity: IdentityProtocol[];
}

export interface Reputation {
  score: number;
  total_transactions: number;
  success_rate: number;
  avg_response_time_ms: number;
  dispute_ratio: number;
  verified_reviews: number;
}

export interface ServiceListing {
  service_id: string;
  name: string;
  description: string;
  provider: Provider;
  version: string;
  endpoint_url: string;
  health_check_url?: string;
  status: ServiceStatus;
  pricing: {
    models: PricingModel[];
  };
  supported_protocols: SupportedProtocols;
  slas: SLA[];
  categories: Category[];
  tags: string[];
  region: Region;
  reputation: Reputation;
  is_featured?: boolean;
  featured_until?: string;
  registered_at: string;
  last_updated: string;
  last_health_check: string;
}

// Query types
export interface QueryParams {
  tags?: string[];
  protocol?: string;
  max_price?: number;
  region?: string;
  category?: Category;
  min_success_rate?: number;
  limit?: number;
  offset?: number;
}

export interface QueryResult {
  query: QueryParams;
  results: ServiceListing[];
  total: number;
  page: number;
}

// Transaction types for OWS payment integration
export interface PaymentQuoteRequest {
  service_id: string;
  chain_id?: string;
  agent_id?: string;
}

export interface PaymentQuoteResponse {
  service_id: string;
  service_name: string;
  provider: string;
  amount: number;
  currency: string;
  chain_id: string;
  recipient_aep_id: string;
  expires_at: string;
  x402_payload: X402Payload;
}

export interface X402Payload {
  scheme: "x402";
  version: string;
  network: string;
  maxPriceRequired: number;
  currency: string;
  currentPrice: number;
  currentPriceUSD: number;
  resource: {
    name: string;
    description: string;
    url: string;
  };
  payTo: string;
  mimeType: string;
  outputSchema: string;
  expiresAt: string;
  metadata: Record<string, any>;
}

export interface PaymentVerifyRequest {
  service_id: string;
  signed_tx_hash: string;
  chain_id?: string;
  agent_id?: string;
}

export interface PaymentVerifyResponse {
  status: "confirmed" | "failed";
  tx_hash?: string;
  service_id: string;
  service_name?: string;
  provider?: string;
  chain_id?: string;
  agent_id?: string | null;
  verified_at: string;
  message: string;
}

export interface MCPRequest {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, any>;
  id: number | string;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPService {
  service_id: string;
  name: string;
  provider: { name: string; aep_id: string };
  pricing: { models: PricingModel[] };
  reputation: { score: number; total_transactions: number };
  supported_protocols: { payment: PaymentProtocol[] };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

// Error response types
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: string[];
  request_id?: string;
  retry_after?: number;
  identity_endpoint?: string;
}
