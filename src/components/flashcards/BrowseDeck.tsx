"use client";

import { useState } from "react";
import Flashcard from "./Flashcard";
import ConfidenceRater from "./ConfidenceRater";
import type { Country, ProgressMap, Rating } from "@/lib/flashcards/types";

export default function BrowseDeck({
  deck,
  progress,
  onRate,
}: {
  deck: Country[];
  progress: ProgressMap;
  onRate: (code: string, rating: Rating) => void;
}) {
  const [openCode, setOpenCode] = useState<string | null>(null);

  if (!deck.length) {
    return (
      <p className="text-gray-500 text-center py-12">
        No cards in this continent yet — pick a different filter.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {deck.map((country) => {
        const rating = progress[country.code]?.rating ?? null;
        const isOpen = openCode === country.code;
        return (
          <div key={country.code} className="flex flex-col gap-2">
            <Flashcard
              country={country}
              flipped={isOpen}
              onFlip={() => setOpenCode(isOpen ? null : country.code)}
              rating={rating}
              size="small"
            />
            {isOpen && (
              <ConfidenceRater
                selected={rating}
                onRate={(r) => onRate(country.code, r)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
