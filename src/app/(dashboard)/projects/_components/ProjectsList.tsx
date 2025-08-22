"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../../../lib/supabase-browser";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  created_at: string;
};

export default function ProjectsList() {
  const [rows, setRows] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();

    const load = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id,name,description,status,created_at")
        .order("created_at", { ascending: false });
      if (error) setErr(error.message);
      else setRows(data as Project[]);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <p style={{ color: "#666" }}>Loading projects…</p>;
  if (err) return <p style={{ color: "crimson" }}>Error: {err}</p>;
  if (!rows || rows.length === 0) return <p>No projects yet.</p>;

  return (
    <ul style={{ marginTop: 12 }}>
      {rows.map((p) => (
        <li key={p.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
          <a href={`/projects/${p.id}`} style={{ fontWeight: 600 }}>{p.name}</a>
          <div style={{ fontSize: 12, color: "#666" }}>
            {p.status || "draft"}{p.description ? ` · ${p.description}` : ""}
          </div>
        </li>
      ))}
    </ul>
  );
}

