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

      // Client
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

      // Build OR for numeric/string client_id matches
      const maybeNum = /^\d+$/.test(id) ? id : null;
      const orParts = [`client_id.eq.${id}`];
      if (maybeNum) orParts.push(`client_id.eq.${maybeNum}`);

      // Projects linked to client — need config for status
      const [pByClient, pUnlinked, sts] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .or(orParts.join(","))
          .order("created_at", { ascending: false }),
        supabase
          .from("projects")
          .select("*")
          .is("client_id", null)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("project_status_types")
          .select("id,name,color")
          .order("name"),
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const save = async () => {
    if (!client) return;
    setSaving(true);
    setErr(null);

    const supabase = supabaseBrowser();
    const payload: Record<string, any> = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      notes: form.notes || null,
    };

    const { error } = await supabase.from("clients").update(payload).eq("id", client.id);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setClient({ ...client, ...payload });
    setEdit(false);
  };

  const linkProject = async () => {
    if (!linkingId || !client) return;
    setErr(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("projects").update({ client_id: client.id }).eq("id", linkingId);
    if (error) {
      setErr(error.message);
      return;
    }

    const found = unlinked.find((p) => p.id === linkingId);
    if (found) {
      setProjects([{ ...found, client_id: client.id }, ...projects]);
      setUnlinked(unlinked.filter((p) => p.id !== linkingId));
      setLinkingId("");
    }
  };

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  // Build a map of status name -> color (case-insensitive)
  const statusIndex = useMemo(() => {
    const idx = new Map<string, string | null>();
    statusTypes.forEach((st) => idx.set(st.name.toLowerCase(), st.color));
    return idx;
  }, [statusTypes]);

  // Derive label & color from each project's config.data
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
      statusColor: color, // hex like #2563eb or null
    };
  });

  if (loading) return <div style={{ padding: 16 }}>Loading client…</div>;
  if (err) {
    const authish = /permission|rls|auth|401|403|JWT/i.test(err);
    return (
      <div style={{ padding: 16, color: "crimson" }}>
        Error: {err}
        <div style={{ color: "#555", marginTop: 6, fontSize: 12 }}>
          {authish
            ? "Tip: RLS might be blocking this action while signed out. Keep the dev anon policy on while you build."
            : "Tip: Verify the row exists and column names match."}
        </div>
      </div>
    );
  }
  if (!client) return <div style={{ padding: 16 }}>Not found.</div>;

  return (
    <div style={{ padding: 16, maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{edit ? "Edit Client" : "Client Details"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {!edit ? (
            <>
              <Link href="/clients">Back to Clients</Link>
              <Link href={`/projects/new?client_id=${client.id}`}>+ New Project</Link>
              <button onClick={() => setEdit(true)}>Edit</button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setEdit(false);
                  setForm(client);
                }}
              >
                Cancel
              </button>
              <button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ color: "#555", fontSize: 13, marginTop: 6 }}>Created: {fmtDate(client.created_at)}</div>

      {/* Client info */}
      {!edit ? (
        <section style={{ border: "1px solid #000", borderRadius: 10, padding: 16, marginTop: 16 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <KV label="Name" value={client.name || "—"} />
            <KV label="Email" value={client.email || "—"} />
            <KV label="Phone" value={client.phone || "—"} />
            <KV label="Address" value={client.address || "—"} />
            <KV label="Notes" value={client.notes || "—"} />
          </div>
        </section>
      ) : (
        <section style={{ border: "1px solid #000", borderRadius: 10, padding: 16, marginTop: 16 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <label>
              Name<input name="name" value={form.name} onChange={onChange} required />
            </label>
            <label>
              Email<input name="email" value={form.email ?? ""} onChange={onChange} />
            </label>
            <label>
              Phone<input name="phone" value={form.phone ?? ""} onChange={onChange} />
            </label>
            <label>
              Address<input name="address" value={form.address ?? ""} onChange={onChange} />
            </label>
            <label>
              Notes<textarea name="notes" value={form.notes ?? ""} onChange={onChange} style={{ minHeight: 100 }} />
            </label>
          </div>
        </section>
      )}

      {/* Projects for this client (now shows Status pill + row tint) */}
      <section style={{ border: "1px solid #000", borderRadius: 10, padding: 16, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Projects for {client.name || "this client"}</h3>
        {derivedProjects.length === 0 ? (
          <p style={{ color: "#666" }}>No projects linked to this client yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: 8 }}>Project</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Created</th>
                  <th style={{ padding: 8 }} />
                </tr>
              </thead>
              <tbody>
                {derivedProjects.map((p) => {
                  const tint = p.statusColor ? hexToRgba(p.statusColor, 0.2) : undefined;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6", background: tint }}>
                      <td style={{ padding: 8 }}>
                        <Link href={`/projects/${p.id}`}>{p.title}</Link>
                      </td>
                      <td style={{ padding: 8 }}>
                        <StatusBadge label={p.statusLabel} color={p.statusColor} />
                      </td>
                      <td style={{ padding: 8 }}>{fmtDate(p.created_at)}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>
                        <Link href={`/projects/${p.id}`}>Open</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p style={{ color: "#666", fontSize: 12, marginTop: 8 }}>
              Status colors come from <code>Settings → Status Types</code>. Custom statuses use no color unless the custom
              text equals a named status (case-insensitive).
            </p>
          </div>
        )}
      </section>

      {/* Link existing projects to this client */}
      <section style={{ border: "1px solid #000", borderRadius: 10, padding: 16, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Link an existing unassigned project</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={linkingId} onChange={(e) => setLinkingId(e.target.value)} style={{ minWidth: 260 }}>
            <option value="">{unlinked.length === 0 ? "No unassigned projects" : "— Select a project —"}</option>
            {unlinked.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({fmtDate(p.created_at)})
              </option>
            ))}
          </select>
          <button onClick={linkProject} disabled={!linkingId}>
            Link to {client.name || "client"}
          </button>
        </div>
        <p style={{ color: "#666", fontSize: 12, marginTop: 8 }}>
          Only projects with <code>client_id = NULL</code> appear here. New projects created from this client are linked automatically.
        </p>
      </section>
    </div>
  );
}

function KV({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <strong>{label}:</strong> {value ?? "—"}
    </div>
  );
}

/** Tiny pill showing status + color */
function StatusBadge({ label, color }: { label: string; color: string | null }) {
  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111",
    fontSize: 13,
    lineHeight: 1,
  };

  const dotStyle: React.CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: color || "#9ca3af", // gray if none
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
  };

  return (
    <span style={pillStyle}>
      <span style={dotStyle} />
      <span>{label || "—"}</span>
    </span>
  );
}

/** Convert #RRGGBB (or #RGB) to rgba(r,g,b,alpha). */
function hexToRgba(hex: string, alpha = 0.2): string | undefined {
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
