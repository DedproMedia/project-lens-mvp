# Project Lens – Development Status

_Last updated: 2025-08-25_

## ✅ Completed
- Folder restructuring with (dashboard) route group
- Sidebar restored and stable across pages
- Supabase authentication routes (/auth, /auth/callback) working
- Email login functional (magic links)
- Temporary dev RLS policy applied (anon can insert/select)
- New Client form created
- New Project form created:
  - Client dropdown with +New link
  - Toggle project elements on/off
  - Client visibility/editability settings
- Project detail page (/projects/[id]):
  - No flicker (Supabase client inside effect)
  - Full editable form for all project elements
  - Saves config + data JSON back into projects.config

## 🔜 Next Up
- Client detail page (/clients/[id])
- Public collaboration link (/share/[token])
  - Respects visibility/editability
  - Allows client to submit edits
- Wire RAMS / Insurance / T&Cs to document store (instead of free text)
- Notifications (email when client submits edits)
- Polish form styling (consistent look)

## 🐞 Known Issues
- Google OAuth login still returns to /auth but doesn’t persist session properly
- Apple OAuth not configured yet
- Current RLS policies are relaxed (dev mode) — need to re-enable strict rules later

