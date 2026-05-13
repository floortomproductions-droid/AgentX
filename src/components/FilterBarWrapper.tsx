"use client";

import { useState } from "react";
import { FilterBar } from "./FilterBar";

interface FilterBarWrapperProps {
  categories: { value: string; label: string }[];
  protocols: { value: string; label: string }[];
  regions: { value: string; label: string }[];
  total: number;
}

export function FilterBarWrapper({ categories, protocols, regions, total }: FilterBarWrapperProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProtocol, setSelectedProtocol] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");

  return (
    <FilterBar
      categories={categories}
      protocols={protocols}
      regions={regions}
      selectedCategory={selectedCategory}
      selectedProtocol={selectedProtocol}
      selectedRegion={selectedRegion}
      total={total}
      onCategoryChange={setSelectedCategory}
      onProtocolChange={setSelectedProtocol}
      onRegionChange={setSelectedRegion}
    />
  );
}
