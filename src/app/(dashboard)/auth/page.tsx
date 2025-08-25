"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [working, setWorking] = useState<"google" | "email" | null>(null);

  // Build redirect once on the client
  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return "/auth/callback";
    return window.location.origin + "/auth/callback";
  }, []);

  // Preflight check — surfaces missing env keys right on the page
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setErr(
        "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel & locally."
      );
    }
  }, []);

  const signInWithGoogle = async () => {
    setErr(null);
    setWorking("google");
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
      // On success, browser navigates to Google (no further code runs here)
      if (!data?.url) {
        // Defensive: older libs sometimes don't return url; do manual redirect if present.
        console.warn("No OAuth URL returned; if nothing happens, check Supabase provider setup.");
      }
    } catch (e: any) {
      console.error("Google OAuth error:", e);
      setErr(e?.message ?? "Google sign-in failed. Check provider config.");
      setWorking(null);
    }
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setWorking("email");
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      console.error("Magic link error:", e);
      setErr(e?.message ?? "Magic link failed. Check Supabase email settings.");
    } finally {
      setWorking(null);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h1 style={{ marginTop: 0 }}>Sign in</h1>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={working !== null}
        style={{
          padding: 10,
          border: "1px solid #ddd",
          borderRadius: 6,
          width: "100%",
          marginBottom: 12,
          opacity: working ? 0.7 : 1,
          cursor: working ? "not-allowed" : "pointer",
        }}
        aria-busy={working === "google"}
      >
        {working === "google" ? "Opening Google…" : "Continue with Google"}
      </button>

      <hr />

      {sent ? (
        <p>Check your email for a magic link. (Look in junk/spam.)</p>
      ) : (
        <form onSubmit={sendMagicLink} style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <button
            type="submit"
            disabled={working !== null}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
            aria-busy={working === "email"}
          >
            {working === "email" ? "Sending…" : "Send magic link"}
          </button>
        </form>
      )}

      {err && (
        <p style={{ color: "crimson", marginTop: 12 }}>
          {err}
        </p>
      )}

      <p style={{ fontSize: 12, color: "#666", marginTop: 12 }}>
        Redirect target: <code>{redirectTo}</code>
      </p>
    </div>
  );
}


