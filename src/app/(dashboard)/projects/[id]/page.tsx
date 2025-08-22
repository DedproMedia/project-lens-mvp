type Props = { params: { id: string } };

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = params;
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ margin: 0, marginBottom: 12 }}>Project #{id}</h1>
      <p>Project details go here…</p>
    </div>
  );
}
