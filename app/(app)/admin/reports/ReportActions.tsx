"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/Spinner";

export default function ReportActions({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function setStatus(status: "reviewed" | "dismissed") {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("user_reports").update({ status }).eq("id", reportId);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => setStatus("reviewed")} disabled={pending} className="btn btn-ghost !px-3">
        {pending && <Spinner />} Mark reviewed
      </button>
      <button onClick={() => setStatus("dismissed")} disabled={pending} className="btn btn-ghost !px-3">
        Dismiss
      </button>
    </div>
  );
}
