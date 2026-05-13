# AgentX VPS Fix Guide — For Claude Code

## What Needs Fixed

The payment quote API endpoint (`/api/payment/quote`) is using the wrong provider ID field, causing wallet lookup failures. Currently it's a hacky fix that works but is confusing.

### Current State (WORKING but wrong)
- `provider-registry.ts` has key `aep:floortom` (should be `agentx:floortom`)
- `route.ts` endpoint looks up `aep:floortom`
- This works because they match, but `aep:` prefix is for AE Protocol specs site, `agentx:` is for the marketplace

### What Should Happen
- `provider-registry.ts` should use `agentx:floortom` (correct namespace)
- `route.ts` endpoint should look up `service.provider.agentx_id` instead of `service.provider.aep_id`
- The `Provider` type in `aep.ts` needs `agentx_id?: string` field

## Files to Edit

All on VPS at `/var/www/agentx/`:

### 1. `/var/www/agentx/src/types/aep.ts`
Add `agentx_id` to Provider interface:
```typescript
export interface Provider {
  agentx_id?: string;  // ADD THIS LINE
  name: string;
  url: string;
  aep_id: string;
  contact: string;
}
```

### 2. `/var/www/agentx/src/lib/provider-registry.ts`
Change key from `aep:floortom` back to `agentx:floortom`:
```typescript
const PROVIDER_REGISTRY: Record<string, ProviderRecord> = {
  "agentx:floortom": {  // CHANGE FROM "aep:floortom"
    provider_id: "agentx:floortom",  // CHANGE FROM "aep:floortom"
    name: "Floortom Studio",
    wallets: {
      // ... keep all wallet addresses as-is
    }
  }
  // ... other providers
};
```

### 3. `/var/www/agentx/src/app/api/payment/quote/route.ts`
Change line ~50 from:
```typescript
const providerId = service.provider.aep_id || `agentx:${service.provider.name.toLowerCase().replace(/\s+/g, '-')}`;
```
To:
```typescript
const providerId = service.provider.agentx_id || `agentx:${service.provider.name.toLowerCase().replace(/\s+/g, '-')}`;
```

## Wallet Addresses (DO NOT CHANGE)

```
Solana USDC: CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9
BTC:         bc1qxtav4h7cl7p6uk4l0j3cfhugd730pktl4e6v7w
ETH/Base:    0xAaA8ABD423254AeBFb51014F863E9da9F123aEbC
BNB:         0x7129ad7e761967b64a7e54c486a22884a774bfe8
XRP:         rpvijHi2nVY9WWAJhojsAX5tJmHdmLtFhq (dest tag: 436803643)
TON:         UQCiwOHpM_-Ws2fE1APCngj0DDo7pzI9eDApjDGYQQdJEYB_
DOGE:        D8dP9zeEit2P9jZ9ZPoqjncdU4PmBHaGix
```

## Build & Deploy Steps

```bash
# SSH into VPS
ssh -i ~/.ssh/agentx_key -o StrictHostKeyChecking=no root@168.231.117.176

# Navigate to app
cd /var/www/agentx

# Make the 3 edits above

# Stop PM2
pm2 stop agentx

# Build (this takes ~30-60 seconds, be patient)
npm run build

# If build succeeds, restart
pm2 start agentx

# If build fails, check error and fix before restarting
```

## Test Commands (run on VPS)

```bash
# Test Solana USDC wallet
curl -s 'http://localhost:3000/api/payment/quote?service_id=floortom-audio-master&chain_id=solana' | python3 -m json.tool

# Test Bitcoin
curl -s 'http://localhost:3000/api/payment/quote?service_id=floortom-audio-master&chain_id=bitcoin' | python3 -m json.tool

# Test Base/ETH
curl -s 'http://localhost:3000/api/payment/quote?service_id=floortom-audio-master&chain_id=eip155:8453' | python3 -m json.tool

# Verify response contains:
# "recipient_address": "CL4gJQMCuBNLoRPdbEgwdRkyH6RLC2Eak6yombja4vD9" (for Solana)
```

## Credentials

### SSH Key
- **Key file:** `~/.ssh/agentx_key` (on Steve's MacBook)
- **VPS IP:** `168.231.117.176`
- **User:** `root`
- **Command:** `ssh -i ~/.ssh/agentx_key -o StrictHostKeyChecking=no root@168.231.117.176`

### PM2 Process
- **Name:** `agentx`
- **Status:** `pm2 status`
- **Logs:** `pm2 logs agentx --lines 50`

### Service Registry Data
- **File:** `/var/www/agentx/data/services.json`
- Contains all service listings including Floortom services

## Other Files Worth Knowing

- `/var/www/agentx/src/app/api/payment/verify/route.ts` — Payment verification endpoint
- `/var/www/agentx/src/app/api/payment/pay/route.ts` — Payment required endpoint
- `/var/www/agentx/src/app/api/health/route.ts` — Health check
- `/var/www/agentx/public/agents.html` — Marketplace frontend
- `/var/www/agentx/aeprotocol.html` — AE Protocol specs page

## Important Notes

1. **Build hangs:** Next.js build on this VPS can take 60+ seconds. If it seems stuck, wait.
2. **PM2 restart:** After successful build, always `pm2 restart agentx` (or `pm2 start` if deleted)
3. **No sudo needed:** Running as root already
4. **Git:** Repo is at `/var/www/agentx` with full git history — commit changes when done
5. **Services data:** Wallet addresses are also in `services.json` provider objects, but the payment endpoint uses `provider-registry.ts` for lookups

## Contact

If stuck: Steve Curtis — steve@floortom.com or Telegram

---
*Created: 2026-05-13*
*Purpose: Fix provider ID namespace confusion in AgentX payment API*
