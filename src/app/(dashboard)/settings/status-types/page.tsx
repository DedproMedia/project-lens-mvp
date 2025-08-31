// FILE 2: src/app/(dashboard)/settings/status-types/page.tsx
load();
return ()=>{ mounted = false; };
},[]);


const add = async () => {
if (!name.trim()) return;
const supabase = supabaseBrowser();
const { data, error } = await supabase
.from("project_status_types")
.insert({ name: name.trim(), color: color })
.select("id,name,color")
.single();
if (error) { setErr(error.message); return; }
setRows(prev=> [...prev, { id:Number(data!.id), name:String(data!.name), color:(data as any).color ?? null }].sort((a,b)=>a.name.localeCompare(b.name)));
setName("");
};


const save = async (r: Row) => {
const supabase = supabaseBrowser();
const { error } = await supabase.from("project_status_types").update({ name: r.name, color: r.color }).eq("id", r.id);
if (error) { setErr(error.message); return; }
};


const remove = async (id: number) => {
if (!confirm("Delete this status?")) return;
const supabase = supabaseBrowser();
const { error } = await supabase.from("project_status_types").delete().eq("id", id);
if (error) { setErr(error.message); return; }
setRows(prev=> prev.filter(x=>x.id!==id));
};


if (loading) return <div style={{ padding:16 }}>Loading…</div>;


return (
<div style={{ padding:16, maxWidth:900 }}>
<h1 style={{ marginTop:0 }}>Project Status Types</h1>
<p style={{ color:'#555' }}>Add, edit, or remove the statuses available in project dropdowns.</p>
<p><Link href="/projects">← Back to Projects</Link></p>


{err && <p style={{ color:'crimson' }}>Error: {err}</p>}


<section style={{ border:'1px solid #000', borderRadius:10, padding:16 }}>
<h3 style={{ marginTop:0 }}>Add new</h3>
<div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
<input placeholder="Status name" value={name} onChange={e=>setName(e.target.value)} />
<input type="color" value={color ?? '#000000'} onChange={e=>setColor(e.target.value)} title="Color" />
<button onClick={add}>Add</button>
</div>
</section>


<section style={{ border:'1px solid #000', borderRadius:10, padding:16, marginTop:16 }}>
<h3 style={{ marginTop:0 }}>Existing statuses</h3>
{rows.length === 0 ? (
<p style={{ color:'#666' }}>No statuses yet.</p>
) : (
<div style={{ overflowX:'auto' }}>
<table style={{ width:'100%', borderCollapse:'collapse' }}>
<thead>
<tr style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb' }}>
<th style={{ padding:8 }}>Name</th>
<th style={{ padding:8 }}>Color</th>
<th style={{ padding:8 }}></th>
</tr>
</thead>
<tbody>
{rows.map(r => (
<tr key={r.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
<td style={{ padding:8 }}>
<input value={r.name} onChange={e=> setRows(prev=> prev.map(x=> x.id===r.id ? { ...x, name:e.target.value } : x))} onBlur={()=> save(rows.find(x=>x.id===r.id)!)} />
</td>
<td style={{ padding:8 }}>
<input type="color" value={r.color ?? '#000000'} onChange={e=> setRows(prev=> prev.map(x=> x.id===r.id ? { ...x, color: e.target.value } : x))} onBlur={()=> save(rows.find(x=>x.id===r.id)!)} />
</td>
<td style={{ padding:8, textAlign:'right' }}>
<button onClick={()=> remove(r.id)}>Delete</button>
</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</section>
</div>
);
}
