"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Status = { id: string; name: string; color: string | null };

export default function StatusSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [statuses, setStatuses] = useState<Status[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("project_status_types")
        .select("id, name, color")
        .order("name", { ascending: true });
      if (data) setStatuses(data);
    };
    load();
  }, []);

  const current = statuses.find((s) => s.id === value);

  return (
    <div className="flex items-center gap-2">
      {current && (
        <>
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: current.color || "#999" }}
          />
          <span className="text-sm font-medium">{current.name}</span>
        </>
      )}
      <select
        className="text-xs border rounded px-1 py-0.5 bg-white"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">—</option>
        {statuses.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}


