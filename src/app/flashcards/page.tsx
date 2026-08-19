"use client";

import { useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/flashcards/countries";
import type { Continent } from "@/lib/flashcards/types";
import { useProgress } from "@/lib/flashcards/useProgress";
import ContinentFilter from "@/components/flashcards/ContinentFilter";
import StudyMode from "@/components/flashcards/StudyMode";
import BrowseDeck from "@/components/flashcards/BrowseDeck";
import Dashboard from "@/components/flashcards/Dashboard";

type Tab = "study" | "browse" | "dashboard";

const TABS: { id: Tab; label: string }[] = [
  { id: "study", label: "Learning Mode" },
  { id: "browse", label: "Browse Deck" },
  { id: "dashboard", label: "Dashboard" },
];

export default function FlashcardsPage() {
  const [tab, setTab] = useState<Tab>("study");
  const [continent, setContinent] = useState<Continent | "All">("All");
  const { progress, hydrated, rate } = useProgress();

  const deck = useMemo(
    () => (continent === "All" ? COUNTRIES : COUNTRIES.filter((c) => c.continent === continent)),
    [continent]
  );

  if (!hydrated) {
    return <p className="text-center text-gray-400 py-12">Loading your deck…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`!px-4 !py-2 rounded-lg text-sm font-semibold ${
                tab === t.id
                  ? "!bg-black !text-white"
                  : "!bg-gray-100 !text-gray-600 hover:!bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab !== "dashboard" && (
          <ContinentFilter value={continent} onChange={setContinent} />
        )}
      </div>

      {tab === "study" && (
        <StudyMode key={continent} deck={deck} progress={progress} onRate={rate} />
      )}
      {tab === "browse" && <BrowseDeck deck={deck} progress={progress} onRate={rate} />}
      {tab === "dashboard" && <Dashboard progress={progress} />}
    </div>
  );
}
