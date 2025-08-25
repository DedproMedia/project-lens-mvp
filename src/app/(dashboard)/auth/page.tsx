"use client";

import { useState } from "react";
import { supabaseBrowser } from "../../../lib/supabase-browser";

export default function AuthPage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setErr(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/projects" },
    });
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/projects" },
    });
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h1 style={{ marginTop: 0 }}>Sign in</h1>

      <button
        onClick={signInWithGoogle}
        style={{
          padding: 10,
          border: "1px solid #ddd",
          borderRadius: 6,
          width: "100%",
          marginBottom: 12,
        }}
      >
        Continue with Google
      </button>

      <hr />

      {sent ? (
        <p>Check your email for a magic link.</p>
      ) : (
        <form
          onSubmit={sendMagicLink}
          style={{ display: "grid", gap: 8, marginTop: 12 }}
        >
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 8,
                marginTop: 4,
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 6,
            }}
          >
            Send magic link
          </button>
          {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
        </form>
      )}
    </div>
  );
}
