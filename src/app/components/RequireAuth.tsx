"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    let timer: any;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
        return;
      }

      // wait briefly for auth to settle (covers the moment after /auth/callback)
      timer = setTimeout(async () => {
        const again = await supabase.auth.getSession();
        if (again.data.session) {
          setReady(true);
        } else if (!redirected.current) {
          redirected.current = true;
          router.replace("/auth");
        }
      }, 900);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        clearTimeout(timer);
        setReady(true);
      }
      if (event === "SIGNED_OUT" && !redirected.current) {
        redirected.current = true;
        router.replace("/auth");
      }
    });

    check();

    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (!ready) return null;
  return <>{children}</>;
}


