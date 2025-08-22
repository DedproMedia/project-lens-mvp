// DO NOT add "use client" here
import type { ReactNode } from "react";

// ✅ If Sidebar is in src/components/Sidebar.tsx
import Sidebar from "../components/Sidebar";

// ✅ If you already use "@/components/Sidebar" in other files, use this instead:
// import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar on the left */}
      <aside className="w-[260px] border-r">
        <Sidebar />
      </aside>

      {/* Page content on the right */}
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
}




