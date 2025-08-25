"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "../../../../lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser();

      // 1) If using PKCE (OAuth returns ?code=...), exchange it for a session
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("exchangeCodeForSession error:", error);
          router.replace("/auth?error=oauth");
          return;
        }
      }

      // 2) For magic links (hash tokens), supabase-js handles it automatically.
      // Still, wait for the session to exist.
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // small wait for auth state to settle
        await new Promise((r) => setTimeout(r, 600));
      }

      // 3) Go to next (if provided) or projects
      const next = params.get("next") || "/projects";
      router.replace(next);
    };
    run();
  }, [params, router]);

  return <p style={{ padding: 16 }}>Signing you in…</p>;
}
