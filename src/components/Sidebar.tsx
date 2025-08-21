import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="bg-white/5 border-r border-white/10 p-4">
      <div className="text-xl font-semibold mb-4">Project Lens</div>
      <nav className="space-y-2">
        <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-white/10">
          Dashboard
        </Link>
        <Link href="/clients" className="block px-3 py-2 rounded hover:bg-white/10">
          Clients
        </Link>
        <Link href="/ics" className="block px-3 py-2 rounded hover:bg-white/10">
          ICS Feed
        </Link>
        <Link href="/settings/calendar" className="block px-3 py-2 rounded hover:bg-white/10">
          Calendar Integration
        </Link>
      </nav>
    </aside>
  );
}