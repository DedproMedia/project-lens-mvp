"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import StatusSelect from "@/app/components/StatusSelect";

type ProjectRow = {
  id: string;
  title: string | null;
  headline_description: string | null;
  created_at: string | null;
  client: { name: string | null } | null;
  status: { id: string; name: string | null; color: string | null } | null;
  status_type_id: string | null;
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
          `id, title, headline_description, created_at, status_type_id,
           client:clients(name), 
           status:project_status_types(id, name, color)`
        )
        .order("created_at", { ascending: false });

      if (!error && data) setRows(data as any);
      setLoading(false);
    };
    load();
  }, []);

  const updateStatus = async (projectId: string, statusId: string | null) => {
    const supabase = supabaseBrowser();
    await supabase.from("projects").update({ status_type_id: statusId }).eq("id", projectId);
    setRows((prev) =>
      prev.map((row) =>
        row.id === projectId
          ? { ...row, status_type_id: statusId, status: row.status } // UI updates instantly
          : row
      )
    );
  };

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
            ? `${p.status.color}33` // 20% opacity
            : "transparent";

          return (
            <tr key={p.id} style={{ backgroundColor: bgColor }} className="hover:bg-gray-50">
              <td className="px-3 py-2 border border-gray-200">
                <Link href={`/projects/${p.id}`} className="text-blue-600 hover:underline">
                  {p.title || "(untitled)"}
                </Link>
              </td>
              <td className="px-3 py-2 border border-gray-200">{p.client?.name || "—"}</td>
              <td className="px-3 py-2 border border-gray-200">
                <StatusSelect value={p.status_type_id} onChange={(id) => updateStatus(p.id, id)} />
              </td>
              <td className="px-3 py-2 border border-gray-200">
                {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

