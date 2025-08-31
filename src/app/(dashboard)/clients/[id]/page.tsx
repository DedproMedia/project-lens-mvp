"use client";
<td style={{ padding: "8px" }}>{labelFor(key)}</td>
<td style={{ padding: "8px" }}>
<input
type="checkbox"
checked={visible[key]}
onChange={() => toggle(visible, setVisible, key)}
disabled={key === "project_status"}
/>
</td>
<td style={{ padding: "8px" }}>
<input
type="checkbox"
checked={editable[key]}
onChange={() => toggle(editable, setEditable, key)}
disabled={key === "project_status"}
/>
</td>
</tr>
))}
</tbody>
</table>
</section>
)}


<div style={{ display: "flex", gap: 8 }}>
<button type="submit" disabled={saving} style={{ padding: "10px 14px" }}>{saving ? "Creating…" : "Create project"}</button>
</div>


{err && <p style={{ color: "crimson" }}>Error: {err}</p>}
{collabLink && <p style={{ fontSize: 13 }}>Collaboration link: <code>{collabLink}</code></p>}
</form>
</div>
);
}


function labelFor(key: ElementKey) {
switch (key) {
case "project_title": return "Project Title";
case "client_name": return "Client Name";
case "deliverables": return "Deliverables";
case "project_dates_locations": return "Project Date & Location";
case "project_status": return "Project Status";
case "headline_description": return "Headline Description";
case "client_budget": return "Client Budget";
case "project_cost": return "Project Cost";
case "style_direction": return "Style Direction";
case "shotlist": return "Shotlist";
case "delivery_links": return "Delivery Links";
case "expenses": return "Expenses";
case "terms_and_conditions": return "Terms & Conditions";
case "rams": return "RAMS";
case "insurance": return "Insurance";
case "additional_requests": return "Additional Requests";
case "notes": return "Notes";
}
}


function cryptoRandom(len: number) {
const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const arr = new Uint32Array(len);
// @ts-ignore
(globalThis.crypto || (window as any).crypto).getRandomValues(arr);
let out = "";
for (let i = 0; i < len; i++) out += alphabet[arr[i] % alphabet.length];
return out;
}