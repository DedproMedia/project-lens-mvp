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
      const { data } = await supabase.from("project_status_types").select("id, name, color");
      if (data) setStatuses(data);
    };
    load();
  }, []);

  return (
    <select
      className="w-full border rounded-md px-3 py-2 text-sm"
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">Select status…</option>
      {statuses.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

