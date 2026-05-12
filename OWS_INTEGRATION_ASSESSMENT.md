# OWS Integration Assessment — AgentX Backend

**Date:** 2026-05-08
**Assessor:** Mark (orchestrator)
**Repo:** ~/Desktop/AgentX/
**Status:** Viable — requires focused changes, no architectural rebuild

---

## Current Backend Snapshot

**Stack:** Next.js 14 (App Router) + TypeScript + static JSON data store
**Deployment:** Not yet deployed (localhost dev only)
**Data:** In-memory JSON (data/services.json) — 8 sample services

### Existing API Routes

| Route | Method | What It Does |
|---|---|---|
| `/api/services` | GET | Filtered list of services (category, protocol, price, region, success rate) |
| `/api/services` | POST | Register a new service (validation + ID generation) |
| `/api/services/[id]` | GET | Single service details |
| `/api/services/[id]/reputation` | GET | Reputation metrics with decayed score calculation |
| `/api/health` | GET | Health check + service count |

### Data Model — Key Fields

- `service_id` — auto-generated slug + timestamp
- `provider` — name, url, aep_id, contact
- `pricing.models` — per_call, bulk, subscription, negotiated (USD/EUR/GBP/USDC/BTC)
- `supported_protocols.payment` — mpp, acp, ucp, x402, ap2
- `reputation` — score, transactions, success_rate, response_time, disputes, reviews
- `slas` — uptime, latency, refund policy tiers

### What's Working
✅ Service discovery API (filter, sort, paginate)
✅ Registration endpoint with validation
✅ Reputation scoring with time-decay
✅ Health check
✅ TypeScript types across the stack

### What's Missing (for production)
❌ No database — JSON file in memory, resets on restart
❌ No authentication/authorization
❌ No real payment integration — just protocol labels
❌ No transaction execution or settlement tracking
❌ No webhook or callback system
❌ No provider dashboard or API key management

---

## OWS Integration Analysis

### The Good News

**OWS is designed exactly for this architecture.**

- **Local-first** — user's wallet lives on their machine, not your server
- **Non-custodial** — you never hold funds, no regulatory burden
- **MCP + REST + SDK** — fits cleanly into Next.js API routes
- **Policy engine** — user sets limits, your backend just requests payment
- **x402 compatible** — your `supported_protocols.payment` already lists x402

### Integration Points

| Current | With OWS | Effort |
|---|---|---|
| `supported_protocols.payment: ["x402"]` (label only) | Actual x402 payment request handling | Medium |
| No wallet model | Add `wallet_address` field to user/provider records | Low |
| No transaction tracking | Add transaction log table/JSON | Low |
| Static pricing in USD/USDC | Dynamic crypto pricing via OWS quote | Medium |
| Service discovery only | Service discovery + **payment execution** | Medium |

### What Changes Are Needed

**1. Add OWS SDK dependency**
```bash
npm install @open-wallet-standard/core
```

**2. New API routes**

| Route | Purpose |
|---|---|
| `/api/payment/quote` | Get price quote for a service call |
| `/api/payment/request` | Generate x402 payment request for agent |
| `/api/payment/verify` | Verify signed payment on-chain |
| `/api/provider/wallet` | Register provider's OWS wallet address |
| `/api/transactions` | Log completed transactions |

**3. Extend data model**

```typescript
// Add to ServiceListing
provider_wallet_address?: string;  // OWS-derived address for this chain
payment_routes: {
  protocol: "x402" | "ows-direct";
  chain_id: string;  // eip155:1, solana:mainnet, etc.
  accepted_tokens: string[];  // USDC, ETH, SOL
}[];

// New: Transaction record
transaction: {
  tx_id: string;
  service_id: string;
  buyer_agent_id: string;
  seller_provider_id: string;
  amount: number;
  token: string;
  chain_id: string;
  status: "pending" | "confirmed" | "failed";
  signed_payload: string;  // OWS signature
  block_hash?: string;
  timestamp: string;
};
```

**4. Payment flow (simplified)**

```
Buyer Agent → AgentX API /payment/quote
    ↓
AgentX returns: { amount, token, chain_id, recipient_address, x402_payload }
    ↓
Buyer Agent → OWS (local) → signs transaction within policy limits
    ↓
Buyer Agent → AgentX API /payment/verify (with signed tx)
    ↓
AgentX validates on-chain → records transaction → unlocks service access
```

### Critical Design Decision

**AgentX does NOT hold funds or touch private keys.**

The backend only:
1. Generates payment requests (x402 payloads)
2. Verifies signatures against on-chain state
3. Logs transactions for reputation tracking
4. Acts as escrow of *trust* (reputation), not escrow of *funds*

This keeps you out of money transmitter territory.

---

## Viability Verdict

| Aspect | Assessment |
|---|---|
| **Technical feasibility** | ✅ High — OWS is built for this exact use case |
| **Code complexity** | 🟡 Medium — new API routes, payment flow, transaction logging |
| **Regulatory risk** | ✅ Low — non-custodial, never hold funds |
| **Time to prototype** | 🟡 1-2 weeks for basic x402 + OWS integration |
| **Dependencies** | 🟡 OWS SDK is new (v1.0.0), but backed by major players |
| **Skill required** | 🟡 Needs someone comfortable with crypto/Web3 concepts |

### Recommended Next Steps

1. **Deploy current backend to Vercel** (see what we have, get health check running)
2. **Install OWS SDK** locally, test wallet creation and signing flow
3. **Build `/api/payment/quote` prototype** — static quote for one service
4. **Test end-to-end:** AgentX → OWS → sign → verify → record
5. **Then:** Update front-end protocol labels to reflect actual capability

---

## Comparison: OWS vs. Visa Agentic Ready

| Factor | OWS (MoonPay) | Visa Agentic Ready |
|---|---|---|
| **Availability** | ✅ Live now, open-source | ⏳ Pending application |
| **Custody** | ✅ Self-custody | ❓ Visa-controlled tokens |
| **Integration** | 🟡 SDK + REST | 🟡 Requires Visa partnership |
| **User base** | 🟡 Crypto-native agents | ✅ Mainstream (Barclays, HSBC, etc.) |
| **Fees** | 🟡 Network gas + maybe MoonPay spread | ✅ Card network rates |
| **Your role** | ✅ Marketplace only | ❓ May need more compliance |
| **Risk for small op** | ✅ Low | ❓ High (approval uncertain) |

**Verdict:** OWS is the pragmatic path. Visa is the aspirational path. Build on OWS now, add Visa later if approved.

---

## Open Questions

1. Does Steve want to handle crypto/Web3 concepts himself, or delegate to coder agent?
2. What's the first service we should enable for real payments? (e.g. NEMO health queries)
3. Do we need a testnet deployment for safe experimentation?
4. Should we start with Base (low fees) or Ethereum mainnet (more liquidity)?

---

_Ready to proceed with backend integration if Steve approves._
