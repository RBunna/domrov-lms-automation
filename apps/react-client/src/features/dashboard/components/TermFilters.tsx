import type { Term } from "@/types/classCard";

interface TermFiltersProps {
  activeTerm: Term;
  onChange: (term: Term) => void;
}

const terms: Term[] = ["All", "Term1", "Term2", "Term3"];

export default function TermFilters({
  activeTerm,
  onChange,
}: TermFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {terms.map((term) => (
        <button
          key={term}
          onClick={() => onChange(term)}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${activeTerm === term
              ? "bg-primary text-white border-primary"
              : "bg-white text-slate-700 border-slate-200 hover:border-primary"
            }`}
        >
          {term}
        </button>
      ))}
    </div>
  );
}
