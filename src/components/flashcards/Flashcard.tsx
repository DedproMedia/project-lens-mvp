"use client";

import { flagEmoji } from "@/lib/flashcards/flag";
import { confidenceStyle } from "@/lib/flashcards/confidence";
import type { Country, Rating } from "@/lib/flashcards/types";

export default function Flashcard({
  country,
  flipped,
  onFlip,
  rating,
  size = "large",
}: {
  country: Country;
  flipped: boolean;
  onFlip: () => void;
  rating: Rating | null;
  size?: "large" | "small";
}) {
  const style = confidenceStyle(rating);
  const isLarge = size === "large";

  return (
    <button
      type="button"
      onClick={onFlip}
      className={`!p-0 w-full ${isLarge ? "h-64" : "h-40"} rounded-2xl border-4 ${style.border} ${style.bg} shadow-md flex flex-col items-center justify-center gap-3 transition-colors`}
    >
      <span className={isLarge ? "text-6xl" : "text-4xl"}>{flagEmoji(country.code)}</span>
      {!flipped ? (
        <div className="text-center px-3">
          <p className={`font-bold ${isLarge ? "text-xl" : "text-base"} text-gray-900`}>
            {country.name}
          </p>
          <p className="text-xs text-gray-400 mt-1">Tap to reveal capital</p>
        </div>
      ) : (
        <div className="text-center px-3">
          <p className={`font-bold ${isLarge ? "text-2xl" : "text-lg"} text-gray-900`}>
            {country.capital}
          </p>
          <p className="text-xs text-gray-400 mt-1">{country.name}</p>
        </div>
      )}
    </button>
  );
}
