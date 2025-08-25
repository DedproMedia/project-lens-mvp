"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  // local form
  const [form, setForm] = useState<Client>({
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase.from("clients").select("*").eq("id", params.id).single();
      if (!mounted) return;
      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }
      const c: Client = {
        id: String(data.id),
        name: String(data.name ?? ""),
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        notes: data.notes ?? "",
      };
      setClient(c);
      setForm(c);
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [params.id, supabase]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const save = async () => {
    if (!client) return;
    setSaving(true);
    setErr(null);
    const payload: any = {
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
    setClient({ ...form });
    setEdit(false);
  };

  if (loading) return <div style={{ padding: 16 }}>Loading client…</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>Error: {err}</div>;
  if (!client) return <div style={{ padding: 16 }}>Not found.</div>;

  return (
    <div style={{ padding: 16, maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{edit ? "Edit Client" : "Client Details"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {!edit ? (
            <button onClick={() => setEdit(true)}>Edit</button>
          ) : (
            <>
              <button onClick={() => { setEdit(false); setForm(client); }}>Cancel</button>
              <button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </>
          )}
        </div>
      </div>

      {!edit ? (
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <div><strong>Name:</strong> {client.name || "—"}</div>
          <div><strong>Email:</strong> {client.email || "—"}</div>
          <div><strong>Phone:</strong> {client.phone || "—"}</div>
          <div><strong>Address:</strong> {client.address || "—"}</div>
          <div><strong>Notes:</strong> {client.notes || "—"}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <label>Name<input name="name" value={form.name} onChange={onChange} /></label>
          <label>Email<input name="email" value={form.email ?? ""} onChange={onChange} /></label>
          <label>Phone<input name="phone" value={form.phone ?? ""} onChange={onChange} /></label>
          <label>Address<input name="address" value={form.address ?? ""} onChange={onChange} /></label>
          <label>Notes<textarea name="notes" value={form.notes ?? ""} onChange={onChange} style={{ minHeight: 80 }} /></label>
          {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
        </div>
      )}
    </div>
  );
}
