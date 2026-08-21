"use client";

import { useMemo } from "react";
import { COUNTRIES } from "@/lib/flashcards/countries";
import { CONTINENTS, type ProgressMap } from "@/lib/flashcards/types";
import { confidenceBand } from "@/lib/flashcards/confidence";

interface ContinentStats {
  continent: string;
  total: number;
  unrated: number;
  low: number;
  medium: number;
  high: number;
  ratedCount: number;
  avgConfidencePct: number | null;
}

function computeStats(progress: ProgressMap): ContinentStats[] {
  return CONTINENTS.map((continent) => {
    const countries = COUNTRIES.filter((c) => c.continent === continent);
    let unrated = 0,
      low = 0,
      medium = 0,
      high = 0,
      ratedSum = 0,
      ratedCount = 0;

    for (const c of countries) {
      const rating = progress[c.code]?.rating ?? null;
      const band = confidenceBand(rating);
      if (band === "unrated") unrated++;
      else if (band === "low") low++;
      else if (band === "medium") medium++;
      else high++;
      if (rating !== null) {
        ratedSum += rating;
        ratedCount++;
      }
    }

    return {
      continent,
      total: countries.length,
      unrated,
      low,
      medium,
      high,
      ratedCount,
      avgConfidencePct: ratedCount ? Math.round(((ratedSum / ratedCount) / 5) * 100) : null,
    };
  });
}

export default function Dashboard({ progress }: { progress: ProgressMap }) {
  const stats = useMemo(() => computeStats(progress), [progress]);

  const overall = useMemo(() => {
    const total = stats.reduce((s, c) => s + c.total, 0);
    const ratedCount = stats.reduce((s, c) => s + c.ratedCount, 0);
    const weightedSum = stats.reduce(
      (s, c) => s + (c.avgConfidencePct ?? 0) * c.ratedCount,
      0
    );
    return {
      total,
      ratedCount,
      avgConfidencePct: ratedCount ? Math.round(weightedSum / ratedCount) : null,
    };
  }, [stats]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm text-gray-500">Overall progress</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {overall.ratedCount} / {overall.total} cards rated
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {overall.avgConfidencePct !== null
            ? `Average confidence: ${overall.avgConfidencePct}%`
            : "Start studying to see your confidence score"}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {stats.map((s) => (
          <div key={s.continent} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="font-bold text-gray-900">{s.continent}</h3>
              <span className="text-sm text-gray-500">
                {s.avgConfidencePct !== null ? `${s.avgConfidencePct}% confident` : "Not started"}
              </span>
            </div>
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-200">
              {s.high > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${(s.high / s.total) * 100}%` }}
                />
              )}
              {s.medium > 0 && (
                <div
                  className="bg-amber-400"
                  style={{ width: `${(s.medium / s.total) * 100}%` }}
                />
              )}
              {s.low > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${(s.low / s.total) * 100}%` }}
                />
              )}
              {s.unrated > 0 && (
                <div
                  className="bg-gray-300"
                  style={{ width: `${(s.unrated / s.total) * 100}%` }}
                />
              )}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />{s.high} high</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />{s.medium} medium</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />{s.low} low</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1" />{s.unrated} unrated</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
