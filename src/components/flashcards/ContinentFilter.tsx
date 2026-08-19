"use client";

import { CONTINENTS, type Continent } from "@/lib/flashcards/types";

export default function ContinentFilter({
  value,
  onChange,
}: {
  value: Continent | "All";
  onChange: (continent: Continent | "All") => void;
}) {
  const options: (Continent | "All")[] = ["All", ...CONTINENTS];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`!px-3 !py-1.5 rounded-full text-sm font-semibold border ${
              active
                ? "!bg-black !text-white border-black"
                : "!bg-white !text-gray-700 border-gray-300 hover:!bg-gray-100"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
