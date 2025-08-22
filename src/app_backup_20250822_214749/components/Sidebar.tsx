export default function Sidebar() {
  return (
    <aside className="bg-white/5 border-r border-white/10 p-4">
      <div className="text-xl font-semibold mb-4">Project Lens</div>
      {/* put your nav links here */}
      <nav className="grid gap-2 text-sm">
        <a href="/projects">Projects</a>
        <a href="/clients">Clients</a>
        <a href="/dashboard">Dashboard</a>
      </nav>
    </aside>
  );
}

