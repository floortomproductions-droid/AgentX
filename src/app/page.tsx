import { ServiceListing } from "@/types/aep";
import { ServiceCardClient } from "@/components/ServiceCardClient";
import { FilterBar } from "@/components/FilterBar";

interface SearchParams {
  category?: string;
  protocol?: string;
  region?: string;
}

async function getServices(searchParams: SearchParams): Promise<{ services: ServiceListing[]; total: number }> {
  const params = new URLSearchParams();
  if (searchParams.category && searchParams.category !== "all") {
    params.set("category", searchParams.category);
  }
  if (searchParams.protocol && searchParams.protocol !== "all") {
    params.set("protocol", searchParams.protocol);
  }
  if (searchParams.region && searchParams.region !== "all") {
    params.set("region", searchParams.region);
  }
  params.set("limit", "50");

  const res = await fetch(`http://localhost:3000/api/services?${params.toString()}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch services: ${res.status}`);
  }

  const data = await res.json();
  return { services: data.results, total: data.total };
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { services, total } = await getServices(searchParams);

  const categories = [
    { value: "all", label: "all" },
    { value: "inference", label: "inference" },
    { value: "image-generation", label: "image-gen" },
    { value: "search", label: "search" },
    { value: "data-enrichment", label: "enrichment" },
  ];

  const protocols = [
    { value: "all", label: "all" },
    { value: "mpp", label: "mpp" },
    { value: "acp", label: "acp" },
    { value: "x402", label: "x402" },
    { value: "ucp", label: "ucp" },
    { value: "ap2", label: "ap2" },
  ];

  const regions = [
    { value: "all", label: "all" },
    { value: "global", label: "global" },
    { value: "us-east", label: "us-east" },
    { value: "eu-west", label: "eu-west" },
    { value: "ap-southeast", label: "ap-southeast" },
  ];

  const currentCategory = searchParams.category || "all";
  const currentProtocol = searchParams.protocol || "all";
  const currentRegion = searchParams.region || "all";

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "#1e1e1e" }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span style={{ color: "#00ff88" }}>◆</span>
            <h1
              className="text-2xl font-semibold tracking-wider uppercase"
              style={{ color: "#00ff88", fontFamily: "'JetBrains Mono', monospace" }}
            >
              AE Protocol Registry
            </h1>
            <span
              className="text-[10px] px-2 py-0.5 uppercase tracking-widest ml-2"
              style={{
                background: "#1a1a1a",
                color: "#6b7280",
                border: "1px solid #2a2a2a",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              v0.3
            </span>
          </div>
          <p className="text-sm" style={{ color: "#6b7280", fontFamily: "'JetBrains Mono', monospace" }}>
            AE Protocol Registry — Service Discovery
          </p>
          <p className="text-xs mt-1" style={{ color: "#555" }}>
            Where AI agents discover, compare, and transact
          </p>
        </div>
      </header>

      {/* API status bar */}
      <div
        className="border-b text-xs px-4 py-2"
        style={{ borderColor: "#1e1e1e", background: "#0d0d0d", color: "#555", fontFamily: "'JetBrains Mono', monospace" }}
      >
        <span className="flex items-center gap-2 max-w-6xl mx-auto">
          <span className="health-dot"></span>
          <span className="text-[#555]">registry.aep.standard</span>
          <span className="text-[#333] mx-2">|</span>
          <span style={{ color: "#00ff88" }}>GET</span>
          <span className="text-[#555]">/api/services</span>
          <span className="text-[#333] mx-2">|</span>
          <span className="text-[#555]">{total} services indexed</span>
        </span>
      </div>

      {/* Filter bar */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <FilterBar
          categories={categories}
          protocols={protocols}
          regions={regions}
          selectedCategory={currentCategory}
          selectedProtocol={currentProtocol}
          selectedRegion={currentRegion}
          total={total}
          onCategoryChange={(v) => console.log('category', v)}
          onProtocolChange={(v) => console.log('protocol', v)}
          onRegionChange={(v) => console.log('region', v)}
        />

        {/* Content */}
        {services.length === 0 ? (
          <div
            className="text-center py-20 text-sm"
            style={{ color: "#555", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {"["} no matching services found {"}"}
            <span className="text-xs text-[#444]">try adjusting your filters</span>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            <div
              className="text-xs mb-2 px-1"
              style={{ color: "#555", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {"//"} {total} service{total !== 1 ? "s" : ""} found
            </div>
            {services.map((service) => (
              <ServiceCardClient key={service.service_id} service={service} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="border-t mt-12 py-6 px-4 text-xs"
        style={{ borderColor: "#1e1e1e", color: "#444", fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span>AE Protocol v0.3 — Draft Proposal</span>
          <span className="text-[#333]">
            <a href="/api/health" className="hover:text-[#555] transition-colors" style={{ color: "#444" }}>health check</a>
            {" | "}
            <a href="/api/services" className="hover:text-[#555] transition-colors" style={{ color: "#444" }}>api</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
