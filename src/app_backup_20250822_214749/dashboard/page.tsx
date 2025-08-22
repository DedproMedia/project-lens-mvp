// Server Component — no "use client".
import Link from "next/link";

export default async function DashboardPage() {
  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0 }}>Dashboard</h1>
      <div style={{ display: "grid", gap: 8 }}>
        <Link href="/projects" style={{ textDecoration: "underline" }}>Go to Projects</Link>
        <Link href="/clients" style={{ textDecoration: "underline" }}>Go to Clients</Link>
      </div>
    </div>
  );
}

