/**
 * useDashboardFilters - Manages term filter state for dashboard.
 * Extracts filtering logic from dashboard page for reusability.
 */

import { useMemo, useState } from "react";
import type { ClassCard, Term } from "@/types/classCard";

interface UseDashboardFiltersReturn {
  activeTerm: Term;
  setActiveTerm: (term: Term) => void;
  filteredClasses: ClassCard[];
}

export function useDashboardFilters(
  classes: ClassCard[],
): UseDashboardFiltersReturn {
  const [activeTerm, setActiveTerm] = useState<Term>("All");

  const filteredClasses = useMemo(() => {
    // Note: API response doesn't include 'term' field, so we show all classes
    // TODO: Once term field is added to API, implement proper filtering
    return classes;
  }, [classes]);

  return {
    activeTerm,
    setActiveTerm,
    filteredClasses,
  };
}
