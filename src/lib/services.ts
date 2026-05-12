import { ServiceListing, QueryParams, QueryResult } from "@/types/aep";
import servicesData from "../../data/services.json";

const services: ServiceListing[] = servicesData.services as ServiceListing[];

export function getAllServices(params: QueryParams): QueryResult {
  let filtered = [...services];

  // Filter by status (only active by default)
  filtered = filtered.filter((s) => s.status === "active");

  // Filter by category
  if (params.category) {
    filtered = filtered.filter((s) =>
      s.categories.includes(params.category!)
    );
  }

  // Filter by tags
  if (params.tags && params.tags.length > 0) {
    filtered = filtered.filter((s) =>
      params.tags!.some((tag) => s.tags.includes(tag))
    );
  }

  // Filter by payment protocol
  if (params.protocol) {
    filtered = filtered.filter((s) =>
      s.supported_protocols.payment.includes(
        params.protocol! as any
      )
    );
  }

  // Filter by max_price (compare against lowest unit_price)
  if (params.max_price !== undefined) {
    filtered = filtered.filter((s) =>
      s.pricing.models.some((m) => m.unit_price <= params.max_price!)
    );
  }

  // Filter by region
  if (params.region) {
    filtered = filtered.filter((s) => s.region === params.region);
  }

  // Filter by min_success_rate
  if (params.min_success_rate !== undefined) {
    filtered = filtered.filter(
      (s) => s.reputation.success_rate >= params.min_success_rate!
    );
  }

  // Sort: featured services first, then by reputation score
  filtered.sort((a, b) => {
    // Check if featured and not expired
    const aFeatured = !!(a.is_featured && (!a.featured_until || new Date(a.featured_until) > new Date()));
    const bFeatured = !!(b.is_featured && (!b.featured_until || new Date(b.featured_until) > new Date()));
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    // Then by reputation score descending
    return (b.reputation.score || 0) - (a.reputation.score || 0);
  });

  const total = filtered.length;
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const page = Math.floor(offset / limit) + 1;

  const paginated = filtered.slice(offset, offset + limit);

  return {
    query: params,
    results: paginated.map((s) => ({
      service_id: s.service_id,
      name: s.name,
      description: s.description,
      provider: s.provider,
      version: s.version,
      endpoint_url: s.endpoint_url,
      health_check_url: s.health_check_url,
      status: s.status,
      pricing: s.pricing,
      reputation: s.reputation,
      supported_protocols: s.supported_protocols,
      slas: s.slas,
      categories: s.categories,
      tags: s.tags,
      region: s.region,
      is_featured: s.is_featured,
      featured_until: s.featured_until,
      registered_at: s.registered_at,
      last_updated: s.last_updated,
      last_health_check: s.last_health_check || new Date().toISOString(),
    })),
    total,
    page,
  };
}

export function getServiceById(id: string): ServiceListing | undefined {
  return services.find((s) => s.service_id === id);
}

export function registerService(
  service: Omit<ServiceListing, "service_id" | "registered_at" | "last_updated" | "last_health_check" | "reputation">
): ServiceListing {
  const now = new Date().toISOString();
  const id =
    service.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString(36);

  const newService: ServiceListing = {
    ...service,
    service_id: id,
    reputation: {
      score: 3.0,
      total_transactions: 0,
      success_rate: 0.0,
      avg_response_time_ms: 0,
      dispute_ratio: 0.0,
      verified_reviews: 0,
    },
    registered_at: now,
    last_updated: now,
    last_health_check: now,
  };

  services.push(newService);
  return newService;
}
