"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function NewClientPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);

    // Insert only columns you actually have; extra ones are ignored by PostgREST if missing? No—so we pick safe set:
    const payload: Record<string, any> = { name: form.name };
    if (form.email) payload.email = form.email;
    if (form.phone) payload.phone = form.phone;
    if (form.address) payload.address = form.address;
    if (form.notes) payload.notes = form.notes;

    const { data, error } = await supabase.from("clients").insert(payload).select("id").single();
    setSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.push(`/clients`); // back to list
  };

  return (
    <div style={{ padding: 16, maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>New Client</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Name
          <input name="name" value={form.name} onChange={onChange} required
                 style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
        </label>

        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={onChange}
                 style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
        </label>

        <label>
          Phone
          <input name="phone" value={form.phone} onChange={onChange}
                 style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
        </label>

        <label>
          Address
          <input name="address" value={form.address} onChange={onChange}
                 style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }} />
        </label>

        <label>
          Notes
          <textarea name="notes" value={form.notes} onChange={onChange}
                    style={{ display: "block", width: "100%", padding: 8, marginTop: 4, minHeight: 80 }} />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={saving}
                  style={{ padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6 }}>
            {saving ? "Saving…" : "Save client"}
          </button>
        </div>

        {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
      </form>
    </div>
  );
}
