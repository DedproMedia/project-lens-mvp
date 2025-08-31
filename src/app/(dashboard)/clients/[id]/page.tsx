"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);

  // Load once (no flicker) and create supabase client inside the effect
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErr(null);

      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (!mounted) return;

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      const c: Client = {
        id: String(data.id),
        name: data.name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        notes: data.notes ?? "",
        created_at: data.created_at ?? "",
      };

      setClient(c);
      setForm(c);
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

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  if (loading) return <div style={{ padding: 16 }}>Loading client…</div>;
  if (err) {
    const authish = /permission|rls|auth|401|403|JWT/i.test(err);
    return (
      <div style={{ padding: 16, color: "crimson" }}>
        Error: {err}
        <div style={{ color: "#555", marginTop: 6, fontSize: 12 }}>
          {authish
            ? "Tip: RLS might be blocking this read while signed out. Keep the dev anon policy on while you build."
            : "Tip: Check that this client row exists and column names match."}
        </div>
      </div>
    );
  }
  if (!client) return <div style={{ padding: 16 }}>Not found.</div>;

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{edit ? "Edit Client" : "Client Details"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {!edit ? (
            <>
              <Link href="/clients">Back to Clients</Link>
              <button onClick={() => setEdit(true)}>Edit</button>
            </>
          ) : (
            <>
              <button onClick={() => { setEdit(false); setForm(client); }}>Cancel</button>
              <button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ color: "#555", fontSize: 13, marginTop: 6 }}>
        Created: {fmtDate(client.created_at)}
      </div>

      {/* Content */}
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
              Name
              <input name="name" value={form.name} onChange={onChange} required />
            </label>
            <label>
              Email
              <input name="email" value={form.email ?? ""} onChange={onChange} />
            </label>
            <label>
              Phone
              <input name="phone" value={form.phone ?? ""} onChange={onChange} />
            </label>
            <label>
              Address
              <input name="address" value={form.address ?? ""} onChange={onChange} />
            </label>
            <label>
              Notes
              <textarea name="notes" value={form.notes ?? ""} onChange={onChange} style={{ minHeight: 100 }} />
            </label>

            {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
          </div>
        </section>
      )}
    </div>
  );
}

/* small helper for label/value rows */
function KV({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <strong>{label}:</strong> {value ?? "—"}
    </div>
  );
}

