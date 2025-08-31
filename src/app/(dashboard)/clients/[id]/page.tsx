"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

type ProjectRow = {
  id: string;
  title: string;
  created_at?: string | null;
  client_id?: string | number | null;
  config?: any | null;
};

type StatusType = { id: number; name: string; color: string | null };

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Client>({
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    created_at: "",
  });

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [unlinked, setUnlinked] = useState<ProjectRow[]>([]);
  const [linkingId, setLinkingId] = useState<string>("");

  const [statusTypes, setStatusTypes] = useState<StatusType[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErr(null);
      const supabase = supabaseBrowser();

      // Client info
      const c = await supabase.from("clients").select("*").eq("id", id).single();
      if (!mounted) return;
      if (c.error) {
        setErr(c.error.message);
        setLoading(false);
        return;
      }
      const clientRow: Client = {
        id: String(c.data.id),
        name: c.data.name ?? "",
        email: c.data.email ?? "",
        phone: c.data.phone ?? "",
        address: c.data.address ?? "",
        notes: c.data.notes ?? "",
        created_at: c.data.created_at ?? "",
      };
      setClient(clientRow);
      setForm(clientRow);

      const [pByClient, pUnlinked, sts] = await Promise.all([
        supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false }),
        supabase.from("projects").select("*").is("client_id", null).order("created_at", { ascending: false }).limit(20),
        supabase.from("project_status_types").select("id,name,color").order("name"),
      ]);

      if (!mounted) return;

      if (!pByClient.error && pByClient.data) {
        setProjects(
          (pByClient.data as any[]).map((r) => ({
            id: String(r.id),
            title: String(r.name ?? r.title ?? "Untitled"),
            created_at: r.created_at ?? null,
            client_id: r.client_id ?? null,
            config: r.config ?? null,
          }))
        );
      }

      if (!pUnlinked.error && pUnlinked.data) {
        setUnlinked(
          (pUnlinked.data as any[]).map((r) => ({
            id: String(r.id),
            title: String(r.name ?? r.title ?? "Untitled"),
            created_at: r.created_at ?? null,
            client_id: r.client_id ?? null,
            config: r.config ?? null,
          }))
        );
      }

      if (!sts.error && sts.data) {
        setStatusTypes(
          (sts.data as any[]).map((x) => ({
            id: Number(x.id),
            name: String(x.name),
            color: x.color ?? null,
          }))
        );
      }

      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  const statusIndex = useMemo(() => {
    const idx = new Map<string, string | null>();
    statusTypes.forEach((st) => idx.set(st.name.toLowerCase(), st.color));
    return idx;
  }, [statusTypes]);

  const derivedProjects = projects.map((r) => {
    const data = (r.config?.data ?? {}) as Record<string, any>;
    const label: string =
      (data["project_status.custom"] as string) ||
      (data["project_status.name"] as string) ||
      "";
    const color =
      (label &&
        statusIndex.get(label.trim().toLowerCase()) &&
        (statusIndex.get(label.trim().toLowerCase()) as string)) ||
      null;

    return {
      ...r,
      statusLabel: label || "—",
      statusColor: color,
    };
  });

  if (loading) return <div className="p-6 text-gray-600">Loading client…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!client) return <div className="p-6">Not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{client.name}</h1>
        <Link
          href={`/projects/new?client_id=${client.id}`}
          className="bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-semibold"
        >
          + New Project
        </Link>
      </div>

      {/* Projects Table */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Projects</h2>
        {derivedProjects.length === 0 ? (
          <p className="text-gray-600">No projects linked to this client yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-xl shadow-md">
              <thead>
                <tr className="bg-gray-100 text-left text-sm uppercase tracking-wide">
                  <th className="px-6 py-4 font-semibold">Project</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {derivedProjects.map((p, i) => {
                  const tint = p.statusColor
                    ? hexToRgba(p.statusColor, 0.15)
                    : i % 2 === 0
                    ? "#fafafa"
                    : "#ffffff";

                  return (
                    <tr key={p.id} style={{ background: tint }}>
                      <td className="px-6 py-4 font-medium text-lg text-black">
                        <Link href={`/projects/${p.id}`}>{p.title}</Link>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge label={p.statusLabel} color={p.statusColor} />
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{fmtDate(p.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/projects/${p.id}`}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string | null }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium bg-white shadow-sm">
      <span className="w-3 h-3 rounded-full" style={{ background: color || "#9ca3af" }} />
      <span>{label || "—"}</span>
    </span>
  );
}

function hexToRgba(hex: string, alpha = 0.15): string | undefined {
  if (!hex) return undefined;
  let h = hex.trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) {
    const r = h[0] + h[0];
    const g = h[1] + h[1];
    const b = h[2] + h[2];
    return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`;
  }
  if (h.length === 6) {
    const r = h.slice(0, 2);
    const g = h.slice(2, 4);
    const b = h.slice(4, 6);
    return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`;
  }
  return undefined;
}

