"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ProjectRow = {
  id: string;
  title: string | null;
  headline_description: string | null;
  created_at: string | null;
  client: { name: string | null } | null;
  status: { name: string | null; color: string | null } | null;
};

export default function ProjectsList() {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("projects")
        .select(
          `id, title, headline_description, created_at, 
           client:clients(name), 
           status:project_status_types(name, color)`
        )
        .order("created_at", { ascending: false });

      if (!error && data) setRows(data as any);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p>Loading projects…</p>;
  if (rows.length === 0) return <p>No projects yet.</p>;

  return (
    <table className="min-w-full text-sm border-collapse border border-gray-200">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="px-3 py-2 border border-gray-200 text-left">Title</th>
          <th className="px-3 py-2 border border-gray-200 text-left">Client</th>
          <th className="px-3 py-2 border border-gray-200 text-left">Status</th>
          <th className="px-3 py-2 border border-gray-200 text-left">Created</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => {
          const bgColor = p.status?.color
            ? `${p.status.color}33` // 20% opacity in hex
            : "transparent";

          return (
            <tr
              key={p.id}
              style={{ backgroundColor: bgColor }}
              className="hover:bg-gray-50"
            >
              <td className="px-3 py-2 border border-gray-200">
                <Link
                  href={`/projects/${p.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {p.title || "(untitled)"}
                </Link>
              </td>
              <td className="px-3 py-2 border border-gray-200">
                {p.client?.name || "—"}
              </td>
              <td className="px-3 py-2 border border-gray-200">
                {p.status ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.status.color || "#999" }}
                    />
                    {p.status.name}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2 border border-gray-200">
                {p.created_at
                  ? new Date(p.created_at).toLocaleDateString()
                  : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

