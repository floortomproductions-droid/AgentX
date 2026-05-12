"use client";

interface FilterBarProps {
  categories: { value: string; label: string }[];
  protocols: { value: string; label: string }[];
  regions: { value: string; label: string }[];
  selectedCategory: string;
  selectedProtocol: string;
  selectedRegion: string;
  onCategoryChange: (v: string) => void;
  onProtocolChange: (v: string) => void;
  onRegionChange: (v: string) => void;
  total: number;
}

export function FilterBar({
  categories,
  protocols,
  regions,
  selectedCategory,
  selectedProtocol,
  selectedRegion,
  onCategoryChange,
  onProtocolChange,
  onRegionChange,
}: FilterBarProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 p-3 rounded-sm filter-bar"
      style={{
        border: "1px solid #1e1e1e",
        background: "#0d0d0d",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <span className="text-xs uppercase tracking-wider" style={{ color: "#555" }}>
        Filter:
      </span>

      {/* Category filter */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] uppercase" style={{ color: "#444" }}>
          cat:
        </span>
        <select
          className="aep-select text-xs"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", padding: "4px 28px 4px 8px" }}
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Protocol filter */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] uppercase" style={{ color: "#444" }}>
          proto:
        </span>
        <select
          className="aep-select text-xs"
          value={selectedProtocol}
          onChange={(e) => onProtocolChange(e.target.value)}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", padding: "4px 28px 4px 8px" }}
        >
          {protocols.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Region filter */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] uppercase" style={{ color: "#444" }}>
          region:
        </span>
        <select
          className="aep-select text-xs"
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", padding: "4px 28px 4px 8px" }}
        >
          {regions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
