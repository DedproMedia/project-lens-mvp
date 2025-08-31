// DO NOT add "use client" here
import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header */}
      <header className="bg-black text-white px-6 py-4 text-2xl font-bold">
        Project Lens
      </header>

      {/* Sidebar + content */}
      <div className="flex flex-1">
        <aside className="w-[260px] bg-black text-white p-4 font-semibold">
          <Sidebar />
        </aside>
        <main className="flex-1 p-6 bg-white">{children}</main>
      </div>
    </div>
  );
}

