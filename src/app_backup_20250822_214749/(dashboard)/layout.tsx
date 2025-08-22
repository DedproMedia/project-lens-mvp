import Sidebar from "../components/Sidebar";

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




