"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Client = { id: string; name: string };

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [headline, setHeadline] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const supabase = supabaseBrowser();

      // fetch project
      const { data: proj, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (!mounted) return;

      if (error || !proj) {
        setErr(error?.message || "Project not found");
        return;
      }

      setTitle(proj.name ?? proj.title ?? "");
      setHeadline(proj.headline_description ?? "");
      setClientId(proj.client_id ?? null);

      // fetch clients
      const { data: cs } = await supabase.from("clients").select("id,name").order("name");
      if (cs) {
        setClients(cs.map((c) => ({ id: String(c.id), name: c.name })));
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    const supabase = supabaseBrowser();
    const { error } = await supabase
      .from("projects")
      .update({
        name: title,
        title,
        headline_description: headline,
        client_id: clientId,
      })
      .eq("id", id);

    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }

    router.push("/projects");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Project</h1>

      {err && <p className="text-sm text-red-600 mb-2">{err}</p>}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Project Title */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">Project Title</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Headline Description */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">Headline Description</label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            rows={3}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        {/* Client */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">Client</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            value={clientId || ""}
            onChange={(e) => setClientId(e.target.value || null)}
            required
          >
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push("/projects")}
            className="px-4 py-2 rounded-md border text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}



