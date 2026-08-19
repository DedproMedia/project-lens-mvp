"use client";

import { RATING_OPTIONS, confidenceStyle } from "@/lib/flashcards/confidence";
import type { Rating } from "@/lib/flashcards/types";

export default function ConfidenceRater({
  onRate,
  selected = null,
}: {
  onRate: (rating: Rating) => void;
  selected?: Rating | null;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-gray-500">How confident were you?</p>
      <div className="flex gap-2">
        {RATING_OPTIONS.map((opt) => {
          const style = confidenceStyle(opt.value);
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onRate(opt.value)}
              title={opt.label}
              className={`!px-3 !py-2 rounded-lg border-2 text-xs font-semibold transition-transform ${style.bg} ${style.border} ${style.text} ${
                isSelected ? "scale-110 ring-2 ring-offset-1 ring-gray-400" : "hover:scale-105"
              }`}
            >
              <span className="block">{opt.short}</span>
              <span className="block font-normal">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
