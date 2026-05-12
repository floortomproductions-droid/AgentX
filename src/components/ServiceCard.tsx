import { ServiceListing } from "@/types/aep";

function Stars({ score }: { score: number }) {
  const full = Math.floor(score);
  const remainder = score - full;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <span key={i} className="star-filled" style={{ color: "#ffb800" }}>
          ★
        </span>
      );
    } else if (i === full && remainder >= 0.3) {
      stars.push(
        <span key={i} style={{ color: "#ffb800" }}>
          ★
        </span>
      );
    } else {
      stars.push(
        <span key={i} className="star-empty" style={{ color: "#333" }}>
          ★
        </span>
      );
    }
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-sm tracking-wider" title={`${score.toFixed(1)} / 5.0`}>
      {stars}
    </span>
  );
}

interface ServiceCardProps {
  service: ServiceListing;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

export function ServiceCard({ service, isExpanded, onToggleExpand }: ServiceCardProps) {
  const minPrice = Math.min(...service.pricing.models.map((m) => m.unit_price));
  const maxPrice = Math.max(...service.pricing.models.map((m) => m.unit_price));
  const priceDisplay =
    minPrice === maxPrice
      ? `${minPrice}`
      : `${minPrice}–${maxPrice}`;

  const categoryColors: Record<string, string> = {
    inference: "#00ccff",
    "image-generation": "#ff4488",
    search: "#ffb800",
    "data-enrichment": "#44ff44",
  };

  return (
    <div
      className={`aep-card rounded-sm ${isExpanded ? "selected" : ""}`}
      style={{
        border: isExpanded
          ? "1px solid #00ff88"
          : service.is_featured && (!service.featured_until || new Date(service.featured_until) > new Date())
          ? "1px solid #ffb80055"
          : "1px solid #1e1e1e",
        boxShadow: service.is_featured && (!service.featured_until || new Date(service.featured_until) > new Date())
          ? "0 0 12px #ffb80018, inset 0 0 20px #ffb80008"
          : undefined,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Collapsed view — always visible */}
      <div
        className="px-4 py-3 flex flex-wrap items-center gap-3 cursor-pointer select-none"
        onClick={() => onToggleExpand(service.service_id)}
        style={{ minHeight: "48px" }}
      >
        {/* Service name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate" style={{ color: "#e0e0e0" }}>
              {service.name}
            </span>
            {service.is_featured && (!service.featured_until || new Date(service.featured_until) > new Date()) && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-sm font-medium tracking-wider"
                style={{
                  background: "linear-gradient(135deg, #ffb800 0%, #ff8800 100%)",
                  color: "#000",
                  border: "1px solid #ffb80066",
                  textShadow: "0 0 6px #ffb80088",
                  boxShadow: "0 0 8px #ffb80033",
                }}
              >
                ★ FEATURED PRO
              </span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm" style={{ background: "#1a1a1a", color: "#555", border: "1px solid #2a2a2a" }}>
              v{service.version}
            </span>
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
            {service.provider.name}
            {" · "}
            <span className="text-[10px]" style={{ color: "#555" }}>{service.provider.aep_id}</span>
          </div>
        </div>

        {/* Category badge */}
        <span
          className="text-[10px] uppercase tracking-widest px-2 py-1"
          style={{
            color: categoryColors[service.categories[0]] || "#888",
            border: `1px solid ${categoryColors[service.categories[0]] || "#333"}33`,
            background: `${categoryColors[service.categories[0]] || "#333"}11`,
          }}
        >
          {service.categories[0].replace("-", " ")}
        </span>

        {/* Price */}
        <div className="text-right min-w-[80px]">
          <div className="text-xs font-medium" style={{ color: "#00ff88" }}>
            {priceDisplay}
          </div>
          <div className="text-[10px]" style={{ color: "#555" }}>
            {service.pricing.models[0]?.currency} / {service.pricing.models[0]?.unit}
          </div>
        </div>

        {/* Reputation */}
        <div className="text-right min-w-[100px]">
          <div className="flex items-center justify-end gap-1">
            <Stars score={service.reputation.score} />
            <span className="text-xs ml-1" style={{ color: "#888" }}>
              {service.reputation.score.toFixed(1)}
            </span>
          </div>
          <div className="text-[10px]" style={{ color: "#555" }}>
            {service.reputation.total_transactions.toLocaleString()} txns
            {" · "}
            {(service.reputation.success_rate * 100).toFixed(1)}%
          </div>
        </div>

        {/* Expand indicator */}
        <span className="text-[10px]" style={{ color: isExpanded ? "#00ff88" : "#444" }}>
          {isExpanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded view — full details */}
      {isExpanded && (
        <div className="border-t px-4 py-4 space-y-4" style={{ borderColor: "#1e1e1e", background: "#0d0d0d" }}>
          {/* Description */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#555" }}>
              Description
            </div>
            <div
              className="text-xs leading-relaxed"
              style={{ color: "#a0a0a0", whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{
                __html: service.description
                  .replace(/\n/g, "<br/>")
                  .replace(/\*\*(.+?)\*\*/g, "<strong style='color:#d4d4d4'>$1</strong>")
                  .replace(/- /g, "→ "),
              }}
            />
          </div>

          {/* Quick info row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoBlock label="endpoint" value={service.endpoint_url} />
            <InfoBlock label="region" value={service.region} />
            <InfoBlock label="status" value={service.status} accent={service.status === "active" ? "#00ff88" : "#ffb800"} />
            <InfoBlock label="service_id" value={service.service_id} />
          </div>

          {/* Pricing models */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#555" }}>
              Pricing Models
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {service.pricing.models.map((model, i) => (
                <div
                  key={i}
                  className="p-2 text-xs rounded-sm"
                  style={{ border: "1px solid #1e1e1e", background: "#111" }}
                >
                  <span className="uppercase tracking-wider text-[10px]" style={{ color: "#00ff88" }}>
                    {model.type.replace("_", " ")}
                  </span>
                  <div className="mt-1" style={{ color: "#e0e0e0" }}>
                    {model.unit_price} {model.currency}/{model.unit}
                  </div>
                  {model.min_commitment && (
                    <div className="text-[10px] mt-0.5" style={{ color: "#6b7280" }}>
                      min: {model.min_commitment} {model.unit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Supported protocols */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#555" }}>
              Supported Protocols
            </div>
            <div className="flex flex-wrap gap-2">
              {service.supported_protocols.payment.map((p) => (
                <ProtocolBadge key={p} type="payment" value={p} />
              ))}
              {service.supported_protocols.communication.map((p) => (
                <ProtocolBadge key={p} type="communication" value={p} />
              ))}
              {service.supported_protocols.identity.map((p) => (
                <ProtocolBadge key={p} type="identity" value={p} />
              ))}
            </div>
          </div>

          {/* SLAs */}
          {service.slas.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#555" }}>
                Service Level Agreements
              </div>
              <div className="space-y-2">
                {service.slas.map((sla, i) => (
                  <div
                    key={i}
                    className="text-xs p-2 rounded-sm grid grid-cols-2 sm:grid-cols-4 gap-2"
                    style={{ border: "1px solid #1e1e1e", background: "#111" }}
                  >
                    <div>
                      <span className="text-[10px]" style={{ color: "#6b7280" }}>name</span>
                      <div style={{ color: "#d4d4d4" }}>{sla.name}</div>
                    </div>
                    <div>
                      <span className="text-[10px]" style={{ color: "#6b7280" }}>uptime</span>
                      <div style={{ color: "#00ff88" }}>{sla.uptime_pct}%</div>
                    </div>
                    <div>
                      <span className="text-[10px]" style={{ color: "#6b7280" }}>latency</span>
                      <div style={{ color: "#00ccff" }}>
                        {sla.latency_ms >= 86400000
                          ? `${Math.round(sla.latency_ms / 86400000)}d`
                          : sla.latency_ms >= 1000
                          ? `${sla.latency_ms / 1000}s`
                          : `${sla.latency_ms}ms`}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px]" style={{ color: "#6b7280" }}>refund</span>
                      <div style={{ color: "#888" }} className="text-[10px]">{sla.refund_policy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed reputation */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#555" }}>
              Reputation Details
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2 rounded-sm" style={{ border: "1px solid #1e1e1e", background: "#111" }}>
                <div className="text-[10px]" style={{ color: "#6b7280" }}>score</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Stars score={service.reputation.score} />
                  <span style={{ color: "#ffb800" }}>{service.reputation.score.toFixed(1)}</span>
                </div>
              </div>
              <div className="p-2 rounded-sm" style={{ border: "1px solid #1e1e1e", background: "#111" }}>
                <div className="text-[10px]" style={{ color: "#6b7280" }}>transactions</div>
                <div style={{ color: "#e0e0e0" }}>{service.reputation.total_transactions.toLocaleString()}</div>
              </div>
              <div className="p-2 rounded-sm" style={{ border: "1px solid #1e1e1e", background: "#111" }}>
                <div className="text-[10px]" style={{ color: "#6b7280" }}>success rate</div>
                <div style={{ color: "#44ff44" }}>{(service.reputation.success_rate * 100).toFixed(1)}%</div>
              </div>
              <div className="p-2 rounded-sm" style={{ border: "1px solid #1e1e1e", background: "#111" }}>
                <div className="text-[10px]" style={{ color: "#6b7280" }}>avg response</div>
                <div style={{ color: "#00ccff" }}>
                  {service.reputation.avg_response_time_ms >= 86400000
                    ? `${Math.round(service.reputation.avg_response_time_ms / 86400000)}d`
                    : service.reputation.avg_response_time_ms >= 1000
                    ? `${(service.reputation.avg_response_time_ms / 1000).toFixed(1)}s`
                    : `${service.reputation.avg_response_time_ms}ms`}
                </div>
              </div>
              <div className="p-2 rounded-sm" style={{ border: "1px solid #1e1e1e", background: "#111" }}>
                <div className="text-[10px]" style={{ color: "#6b7280" }}>dispute ratio</div>
                <div style={{ color: service.reputation.dispute_ratio < 0.01 ? "#44ff44" : "#ffb800" }}>
                  {(service.reputation.dispute_ratio * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {service.tags.map((tag) => (
              <span key={tag} className="aep-tag text-[10px]">
                #{tag}
              </span>
            ))}
          </div>

          {/* Registered info */}
          <div className="text-[10px]" style={{ color: "#444" }}>
            registered: {new Date(service.registered_at).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
            {" · "}updated: {new Date(service.last_updated).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="text-xs">
      <div className="text-[10px] uppercase tracking-wider" style={{ color: "#555" }}>
        {label}
      </div>
      <div
        className="mt-0.5 truncate"
        style={{ color: accent || "#d4d4d4", fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value}
      </div>
    </div>
  );
}

function ProtocolBadge({
  type,
  value,
}: {
  type: "payment" | "communication" | "identity";
  value: string;
}) {
  const colors: Record<string, string> = {
    mpp: "#00ff88",
    acp: "#00ccff",
    ucp: "#ffb800",
    x402: "#ff4488",
    ap2: "#44ff44",
    mcp: "#00ccff",
    a2a: "#ffb800",
    webmcp: "#888",
    fluxa: "#ff4488",
    "verifiable-intent": "#00ccff",
    ace: "#ffb800",
  };

  const typePrefix: Record<string, string> = {
    payment: "$",
    communication: "~",
    identity: "@",
  };

  return (
    <span
      className="aep-protocol-badge rounded-sm text-[10px]"
      style={{
        color: colors[value] || "#888",
        borderColor: `${colors[value] || "#333"}44`,
        background: `${colors[value] || "#333"}11`,
      }}
      title={type}
    >
      {typePrefix[type] || ""}{value}
    </span>
  );
}
