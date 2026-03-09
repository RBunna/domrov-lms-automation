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
    if (activeTerm === "All") return classes;
    return classes.filter((item) => item.term === activeTerm);
  }, [activeTerm, classes]);

  return {
    activeTerm,
    setActiveTerm,
    filteredClasses,
  };
}
