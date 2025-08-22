import Link from "next/link";

export default async function DashboardPage() {
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Dashboard</h1>
      <ul style={{ paddingLeft: 16, lineHeight: 1.8 }}>
        <li><Link href="/projects">Projects</Link></li>
        <li><Link href="/clients">Clients</Link></li>
        <li><Link href="/settings/calendar">Calendar Settings</Link></li>
      </ul>
    </div>
  );
}
