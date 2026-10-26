---
name: agentx-microservices
description: Use when an agent needs web/site/crypto/Polymarket/email/FX data as a one-off paid call — agentx.sale sells 25 pay-per-call x402 micro-services (USDC on Base). Load for any "get me <data> now" task without API keys.
---

# agentx.sale micro-services (x402 pay-per-call)

Every call: HTTP GET or POST to the route -> 402 challenge -> sign a USDC transferWithAuthorization -> retry with X-PAYMENT -> JSON result in the same request. No signup, no API key. Prices $0.01 - $4.

## Quick examples

```
curl https://agentx.sale/x402/health          # free: live health + service count
curl https://agentx.sale/x402/catalogue       # free: every endpoint + price
```

## All endpoints

- GET https://agentx.sale/x402/weather?city=<city>: Live current weather for any city ($0.01)
- GET https://agentx.sale/x402/site-health?host=<domain>: DNS, TLS certificate, HTTP status + latency snapshot ($0.01)
- GET https://agentx.sale/x402/x402-check?url=<https-url>: x402 Doctor: is a URL a valid agent-payable paid resource? (v1+v2 spec check, grade, verdict) ($0.01)
- GET https://agentx.sale/x402/seo-audit?host=<domain>: Rules-based SEO + agent-readiness audit with score and findings ($0.1)
- GET https://agentx.sale/x402/agent-card?host=<domain>: Site Agent-Readiness Verdict Card: discovery files, TLS, headers, AI-crawler policy, shareable card ($0.01)
- GET https://agentx.sale/x402/protocol-lint?url=<domain>: A2A / MCP protocol card lint with drop-in patched JSON fixes ($0.01)
- GET https://agentx.sale/x402/crawler-policy?host=<domain>: TLS + security headers + AI-crawler policy matrix card ($0.01)
- GET https://agentx.sale/x402/webmcp-check?host=<domain>: WebMCP agent-compatibility check with pass/fail verdict, inventory and findings ($0.1)
- GET https://agentx.sale/x402/crypto-ticker?assets=<symbols>: Live USD price + 24h move for up to 10 tokens (e.g. btc,eth) ($0.01)
- GET https://agentx.sale/x402/fear-greed: Crypto Fear & Greed Index with the last 7 days of history ($0.01)
- GET https://agentx.sale/x402/gas-check?chain=<base|ethereum|...>: Live gas price on six chains with USD cost of a token transfer ($0.01)
- GET https://agentx.sale/x402/polymarket-trending?limit=<n>: Top open Polymarket prediction markets by 24h volume with live YES prices ($0.01)
- GET https://agentx.sale/x402/polymarket-odds?q=<topic>: Live YES/NO odds for any named Polymarket market ($0.01)
- GET https://agentx.sale/x402/polymarket-book?q=<topic>: Polymarket order book: bid/ask, spread and USD depth for both outcomes ($0.01)
- GET https://agentx.sale/x402/polymarket-history?q=<topic>&days=<n>: Polymarket YES-price series (1-90 days) with change and high/low ($0.01)
- GET https://agentx.sale/x402/polymarket-resolution?q=<topic>: Did a Polymarket market resolve, which outcome won, resolution source ($0.01)
- GET https://agentx.sale/x402/polymarket-arb?limit=<n>: Arb scan: flags markets where YES+NO asks sum under $1.00 ($0.01)
- GET https://agentx.sale/x402/email-check?q=<domain>: Email deliverability: MX, SPF, DMARC for a domain, with outreach verdict ($0.01)
- GET https://agentx.sale/x402/fx-rates?base=<cc>&symbols=<cc,cc>: ECB reference FX rates for any fiat pair ($0.01)
- GET https://agentx.sale/x402/btc-fees: Bitcoin fee forecast: sat/vB for next block, 30 min, 1 hour, economy ($0.01)
- POST https://agentx.sale/x402/webmcp-upgrade: WebMCP upgrade order: fetch + journey analysis + generated webmcp.js tool file (syntax-validated) delivered inline or via free job poller ($4)
- POST https://agentx.sale/x402/classify: AI topic classification of supplied text: free-form or caller label set, confidence + rationale ($1.75)
- POST https://agentx.sale/x402/keywords: AI keyword extraction: top salient keywords/phrases with scores, language detected ($0.9)
- GET https://agentx.sale/x402/gtm-roast?url=<https-url>: Legends Roast: any 1-2 of five cartoon legends roast the page's biggest flaw, plus score and verdict ($0.01)
- POST https://agentx.sale/x402/gtm-roast: Same Legends Roast via POST JSON {url} ($0.01)

## Notes for agents
- Two payment rails in one 402: x402 (PAYMENT-REQUIRED header) AND the IETF Machine Payments Protocol (WWW-Authenticate: Payment challenge). Pay over either; MPP clients use standard Authorization: Payment and get a Payment-Receipt back.
- Unpaid request returns 402; the challenge carries payment requirements.
- Long jobs (webmcp-upgrade, gtm-roast, classify) return a job id you poll at /x402/jobs/<id> (free).
- LLM-backed endpoints only run while the "textServices" flag in /x402/health is true.
- ERC-8004 identity: base:1135219. On-chain registry 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432.

## Install as a Claude Code skill

```bash
mkdir -p ~/.claude/skills/agentx-microservices && \
  curl -fsSL https://agentx.sale/skill.md -o ~/.claude/skills/agentx-microservices/SKILL.md
```
