"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PROGRESS, type ProgressMap, type Rating } from "./types";

const STORAGE_KEY = "flashcards:capitals:progress:v1";

function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // localStorage unavailable (private browsing, quota, etc.) - ignore.
    }
  }, [progress, hydrated]);

  const getProgress = useCallback(
    (code: string) => progress[code] ?? DEFAULT_PROGRESS,
    [progress]
  );

  const rate = useCallback((code: string, rating: Rating) => {
    setProgress((prev) => {
      const current = prev[code] ?? DEFAULT_PROGRESS;
      return {
        ...prev,
        [code]: {
          rating,
          timesReviewed: current.timesReviewed + 1,
          lastReviewed: Date.now(),
        },
      };
    });
  }, []);

  const resetAll = useCallback(() => {
    setProgress({});
  }, []);

  return { progress, hydrated, getProgress, rate, resetAll };
}
