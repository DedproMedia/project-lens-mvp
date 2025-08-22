import { redirect } from "next/navigation";

export default function IcsRedirectPage() {
  // Immediately redirect /ics → /settings/calendar
  redirect("/settings/calendar");
}

