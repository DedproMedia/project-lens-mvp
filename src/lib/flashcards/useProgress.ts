"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { safeSupabaseBrowser } from "./supabaseClient";
import { DEFAULT_PROGRESS, type CardProgress, type ProgressMap, type Rating } from "./types";

const STORAGE_KEY = "flashcards:capitals:progress:v1";

interface ProgressRow {
  country_code: string;
  rating: number;
  times_reviewed: number;
  last_reviewed: string;
}

function loadLocalProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function saveLocalProgress(progress: ProgressMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) - ignore.
  }
}

function rowsToProgress(rows: ProgressRow[]): ProgressMap {
  const map: ProgressMap = {};
  for (const row of rows) {
    map[row.country_code] = {
      rating: row.rating as Rating,
      timesReviewed: row.times_reviewed,
      lastReviewed: new Date(row.last_reviewed).getTime(),
    };
  }
  return map;
}

export function useProgress() {
  const supabase = useMemo(() => safeSupabaseBrowser(), []);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [hydrated, setHydrated] = useState(false);
  const progressRef = useRef<ProgressMap>({});
  const mergedForUser = useRef<string | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Track auth state (guest-only if Supabase isn't configured).
  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // Load progress (from Supabase when signed in, localStorage otherwise), merging
  // any guest progress into the account once, the first time a user signs in.
  useEffect(() => {
    if (!authChecked) return;
    let cancelled = false;

    async function load() {
      if (!user || !supabase) {
        setProgress(loadLocalProgress());
        setHydrated(true);
        return;
      }

      const { data, error } = await supabase
        .from("flashcard_progress")
        .select("country_code, rating, times_reviewed, last_reviewed")
        .eq("user_id", user.id);

      if (cancelled) return;

      if (error) {
        console.error("Failed to load flashcard progress", error);
        setProgress(loadLocalProgress());
        setHydrated(true);
        return;
      }

      let remote = rowsToProgress((data ?? []) as ProgressRow[]);

      if (mergedForUser.current !== user.id) {
        mergedForUser.current = user.id;
        const local = loadLocalProgress();
        const toMerge = Object.entries(local).filter(([code]) => !(code in remote));
        if (toMerge.length) {
          const upserts = toMerge.map(([code, p]) => ({
            user_id: user.id,
            country_code: code,
            rating: p.rating,
            times_reviewed: p.timesReviewed,
            last_reviewed: new Date(p.lastReviewed ?? Date.now()).toISOString(),
          }));
          const { error: mergeError } = await supabase.from("flashcard_progress").upsert(upserts);
          if (!mergeError) {
            remote = { ...local, ...remote };
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
      }

      if (!cancelled) {
        setProgress(remote);
        setHydrated(true);
      }
    }

    setHydrated(false);
    load();
    return () => {
      cancelled = true;
    };
  }, [user, authChecked, supabase]);

  // Guests keep their progress in localStorage.
  useEffect(() => {
    if (!hydrated || user) return;
    saveLocalProgress(progress);
  }, [progress, hydrated, user]);

  const getProgress = useCallback(
    (code: string) => progress[code] ?? DEFAULT_PROGRESS,
    [progress]
  );

  const rate = useCallback(
    async (code: string, rating: Rating) => {
      const current = progressRef.current[code] ?? DEFAULT_PROGRESS;
      const updated: CardProgress = {
        rating,
        timesReviewed: current.timesReviewed + 1,
        lastReviewed: Date.now(),
      };
      progressRef.current = { ...progressRef.current, [code]: updated };
      setProgress(progressRef.current);

      if (user && supabase) {
        const { error } = await supabase.from("flashcard_progress").upsert({
          user_id: user.id,
          country_code: code,
          rating: updated.rating,
          times_reviewed: updated.timesReviewed,
          last_reviewed: new Date(updated.lastReviewed!).toISOString(),
        });
        if (error) console.error("Failed to save flashcard progress", error);
      }
    },
    [user, supabase]
  );

  const resetAll = useCallback(async () => {
    progressRef.current = {};
    setProgress({});
    if (user && supabase) {
      const { error } = await supabase.from("flashcard_progress").delete().eq("user_id", user.id);
      if (error) console.error("Failed to reset flashcard progress", error);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, supabase]);

  return { progress, hydrated, getProgress, rate, resetAll, user };
}
