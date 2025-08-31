"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import StatusSelect from "@/app/components/StatusSelect";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

type ProjectRow = {
  id: string;
  title: string | null;
  created_at: string | null;
  status: { id: string; name: string | null; color: string | null } | null;
  status_type_id: string | null;
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const supabase = supabaseBrowser();

      // Load client
      const { data: c, error: cErr } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (cErr) {
        setErr(cErr.message);
        return;
      }
      if (!mounted) return;
      setClient(c);

      // Load projects for this client
      const { data: ps, error: pErr } = await supabase
        .from("projects")
        .select(
          `id, title, created_at, status_type_id,
           status:project_status_types(id, name, color)`
        )
        .eq("client_id", id)
        .order("created_at", { ascending: false });

      if (pErr) {
        setErr(pErr.message);
        return;
      }
      if (!mounted) return;
      setProjects(ps as any);
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const updateStatus = async (projectId: string, statusId: string | null) => {
    const supabase = supabaseBrowser();
    await supabase.from("projects").update({ status_type_id: statusId }).eq("id", projectId);
    setProjects((prev) =>
      prev.map((row) =>
        row.id === projectId ? { ...row, status_type_id: statusId, status: row.status } : row
      )
    );
  };

  if (err) return <p className="text-red-600">{err}</p>;
  if (loading) return <p>Loading…</p>;
  if (!client) return <p>Client not found</p>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        <p className="text-gray-600">{client.email || "—"} | {client.phone || "—"}</p>
        {client.notes && <p className="mt-2 text-sm text-gray-700">{client.notes}</p>}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Projects</h2>
        {projects.length === 0 ? (
          <p>No projects for this client.</p>
        ) : (
          <table className="min-w-full text-sm border-collapse border border-gray-200">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 border border-gray-200 text-left">Title</th>
                <th className="px-3 py-2 border border-gray-200 text-left">Status</th>
                <th className="px-3 py-2 border border-gray-200 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const bgColor = p.status?.color ? `${p.status.color}33` : "transparent";

                return (
                  <tr key={p.id} style={{ backgroundColor: bgColor }} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border border-gray-200">{p.title || "(untitled)"}</td>
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
        )}
      </div>
    </div>
  );
}


