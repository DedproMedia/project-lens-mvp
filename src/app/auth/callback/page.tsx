"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser();

      // Handle OAuth (PKCE) ?code=... → exchange for a session
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("exchangeCodeForSession error:", error);
          router.replace("/auth?error=oauth");
          return;
        }
      }

      // Give supabase-js a tick to hydrate session (covers magic-link too)
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await new Promise((r) => setTimeout(r, 600));
      }

      // Redirect to next or projects
      const next = params.get("next") || "/projects";
      router.replace(next);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <p style={{ padding: 16 }}>Signing you in…</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p style={{ padding: 16 }}>Signing you in…</p>}>
      <CallbackInner />
    </Suspense>
  );
}
