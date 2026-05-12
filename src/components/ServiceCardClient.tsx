"use client";

import { useState } from "react";
import { ServiceListing } from "@/types/aep";
import { ServiceCard } from "./ServiceCard";

export function ServiceCardClient({ service }: { service: ServiceListing }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <ServiceCard
      service={service}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
    />
  );
}
