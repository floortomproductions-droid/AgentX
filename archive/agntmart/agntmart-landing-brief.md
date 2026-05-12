# agntmart Landing Page — Build Brief



---

Build a landing page for Agntmart (agntmart.com). This is a consumer-facing marketplace where AI agents discover, compare, and transact with service providers.

## Design Spec

### Visual direction
- Dark terminal aesthetic base (#0a0a0a background)
- NOT purely dark — add warmth and approachability
- Accent colours: #00ff88 (AEP green for trust/success) and #f47216 (warm orange for CTAs)
- Monospace font for headings (JetBrains Mono or similar)
- Clean sans-serif for body text (Inter)
- Overall feel: a control panel for the agent economy — not a shop, not a docs site. A command centre.

### Layout (single page, sections top to bottom)

#### 1. Header / Hero
- Small "Powered by the AE Protocol" badge top-left (green, subtle)
- Navigation: About | For Providers | Docs | GitHub (minimal, right-aligned)
- Hero: Large headline "Your agents. Their services. One marketplace."
- Subtitle: "Agntmart is the open marketplace where AI agents discover, compare, and transact with trusted service providers. No middlemen. Zero friction."
- CTA button: "Get Early Access" → email signup modal/section
- Secondary CTA: "Read the Spec" → links to the aeprotocol.com
- Visual: Abstract network/connection animation or a sleek terminal-style illustration

#### 2. How It Works (3 steps)
Three columns/cards showing:

1. **Discover** — SVG search icon
   "Your agent searches Agnt Mart and finds matching services ranked by reputation, price, and speed."

2. **Compare & Negotiate** — SVG scales icon
   "Agents compare providers and negotiate terms autonomously — volume discounts, SLA guarantees, everything programmatic."

3. **Transact with Trust** — SVG shield icon
   "Escrow holds payment until delivery is confirmed. If something goes wrong, automated dispute resolution handles it."

#### 3. Why Agntmart
Three columns:
- **Built on the AE Protocol** — Open standard, MIT licensed. Not a walled garden.
- **Protocol-Agnostic Payments** — MPP, USDC, ACP, UCP — Agnt Mart works with them all.
- **Verifiable Reputation** — Every transaction builds tamper-resistant reputation records.

#### 4. For Providers
Larger section with a clear pitch:
- "List your services once. Reach every agent."
- Benefits: Set your own pricing, volume discounts, SLA terms
- "Join the network" CTA

#### 5. Early Access / Signup
- Email input + "Get Early Access" button
- Dropdown or radio for "I am a..." (Service Provider / Agent Builder / Just Curious)
- Simple, one-field option as fallback

#### 6. Footer
- "Built on the AE Protocol" with link to aeprotocol.com
- Links: Spec | GitHub | Contact
- "© 2026 NemoAI Ltd."

## Copy Guidelines

- Professional but not corporate. Warm but not salesy.
- Speak to developers and business owners who will point their agents at this
- UK English spelling (colour, organise, centre)
- "Agntmart" — capital A, 
- "AE Protocol" — capital A, capital E, capital P
- Don't over-explain the protocol. Keep it high-level and benefit-focused

## Technical Requirements

- Single HTML file with embedded CSS and JS
- Responsive (mobile-first)
- Dark theme
- Smooth scroll between sections
- Email signup form that console.logs the submission (backend added later)
- No frameworks, no build step — vanilla HTML/CSS/JS
- Fast load: no heavy dependencies
- Deploy-ready HTML file

## Output

Save as `~/Desktop/amp-registry/agntmart-landing2.html`

## Client Feedback (Applied Mid-Build)

- **No emojis anywhere** — replaced with clean SVG icons
- Use SVG arrow icons on all buttons consistently
- Success state uses SVG checkmark, not text
- Badge visibility improved on "Why Agnt Mart" cards
- Title changed to "Agntmart — Open Agnt Marketplace"
- Hero label changed to "Open Agnt Marketplace"

## Post-Review Tweaks (Applied)

- ✅ "Agnt" used consistently in title and hero label (was "Agent")
- ✅ Badge background bumped to rgba(0, 255, 136, 0.15) for better visibility
