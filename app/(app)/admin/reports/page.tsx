import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import ReportActions from "./ReportActions";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("user_reports")
    .select("*, reporter:profiles!user_reports_reporter_id_fkey(*), reported:profiles!user_reports_reported_user_id_fkey(*)")
    .order("created_at", { ascending: false });

  const list = reports ?? [];

  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <h1 className="display text-2xl">Reports</h1>
        <Link href="/admin" className="btn btn-ghost">← Back to dashboard</Link>
      </div>
      <p className="text-[var(--muted)] mb-6">{list.filter((r) => r.status === "open").length} open</p>

      {list.length === 0 && <p className="text-sm text-[var(--muted)]">No reports yet.</p>}

      <div className="space-y-3">
        {list.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`tag ${r.status === "open" ? "!bg-[var(--danger-soft)] !text-[var(--danger)] !border-transparent" : ""}`}>{r.status}</span>
              <span className="text-xs text-[var(--muted)]">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Avatar url={r.reported?.avatar_url ?? null} name={r.reported?.username ?? "?"} size={28} />
              <Link href={`/admin/users/${r.reported_user_id}`} className="text-sm font-medium hover:underline">
                {r.reported?.full_name || r.reported?.username || "Unknown user"}
              </Link>
              <span className="text-xs text-[var(--muted)]">reported by {r.reporter?.username ?? "someone"}</span>
            </div>
            <p className="text-sm mb-3">{r.reason}</p>
            {r.status === "open" && <ReportActions reportId={r.id} />}
          </div>
        ))}
      </div>
    </>
  );
}
