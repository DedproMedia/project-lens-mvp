"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  created_at?: string | null;
};

export default function ClientsList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setErr(error.message);
        setClients([]);
      } else {
        setClients(
          (data || []).map((c) => ({
            id: String(c.id),
            name: c.name ?? "Unnamed Client",
            email: c.email ?? null,
            phone: c.phone ?? null,
            created_at: c.created_at ?? null,
          }))
        );
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="p-3 text-gray-600 text-sm">Loading clients…</div>;
  if (err) return <div className="p-3 text-red-600 text-sm">Error: {err}</div>;
  if (clients.length === 0) return <div className="p-3 text-gray-600 text-sm">No clients yet.</div>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((c) => (
        <div
          key={c.id}
          className="border border-gray-200 rounded-md shadow-sm p-3 bg-white hover:shadow transition"
        >
          <h3 className="text-sm font-semibold text-black mb-1">{c.name}</h3>
          <p className="text-xs text-gray-600">{c.email || "—"}</p>
          <p className="text-xs text-gray-600">{c.phone || "—"}</p>
          <div className="mt-2 text-right">
            <Link
              href={`/clients/${c.id}`}
              className="text-red-600 hover:text-red-800 font-medium text-xs"
            >
              Open →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

