"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../../../lib/supabase-browser";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export default function ClientsList() {
  const [rows, setRows] = useState<Client[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();

    const load = async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id,name,email,phone,created_at")
        .order("created_at", { ascending: false });
      if (error) {
        setErr(error.message);
      } else {
        setRows(data as Client[]);
      }
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <p style={{ color: "#666" }}>Loading clients…</p>;
  if (err) return <p style={{ color: "crimson" }}>Error: {err}</p>;
  if (!rows || rows.length === 0) return <p>No clients yet.</p>;

  return (
    <ul style={{ marginTop: 12 }}>
      {rows.map((c) => (
        <li key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
          <a href={`/clients/${c.id}`} style={{ fontWeight: 600 }}>{c.name}</a>
          <div style={{ fontSize: 12, color: "#666" }}>
            {c.email || "—"} · {c.phone || "—"}
          </div>
        </li>
      ))}
    </ul>
  );
}

