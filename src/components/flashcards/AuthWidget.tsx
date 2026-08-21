"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { safeSupabaseBrowser } from "@/lib/flashcards/supabaseClient";

export default function AuthWidget() {
  const supabase = useMemo(() => safeSupabaseBrowser(), []);
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setChecked(true);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (!checked) return <div className="h-8 w-24" />;

  // Supabase isn't configured - stay in guest mode without a broken sign-in link.
  if (!supabase) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm text-white/70">
        <span className="hidden sm:inline">
          Signed in as <span className="text-white">{user.email}</span>
        </span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="!bg-transparent !text-white/60 hover:!text-white !p-0 underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth?next=/flashcards"
      className="text-sm text-white/70 hover:text-white underline"
    >
      Sign in to save your progress
    </Link>
  );
}
