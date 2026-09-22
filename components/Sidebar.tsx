"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BottomProfilePanel from "./BottomProfilePanel";
import type { Profile } from "@/types/database";

const STORAGE_KEY = "sidebar-collapsed";

export default function Sidebar({ profile }: { profile: Profile }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    setMounted(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  // Avoid a flash of the wrong width before we've read localStorage.
  if (!mounted) {
    return <aside className="hidden md:block w-56 shrink-0 border-r bg-[var(--surface)] h-screen sticky top-0" />;
  }

  return (
    <aside
      className={`hidden md:flex md:flex-col shrink-0 border-r bg-[var(--surface)] h-screen sticky top-0 transition-all duration-150 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className={`p-4 border-b flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && <Link href="/" className="display text-lg font-semibold">Platform</Link>}
        <button
          type="button"
          onClick={toggle}
          className="btn btn-ghost !px-2"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 text-sm">
        <Link href="/" className={`btn btn-ghost w-full ${collapsed ? "justify-center !px-2" : "justify-start"}`} title="Home">
          {collapsed ? "🏠" : "Home"}
        </Link>
        <Link href="/messages" className={`btn btn-ghost w-full ${collapsed ? "justify-center !px-2" : "justify-start"}`} title="Messages">
          {collapsed ? "💬" : "Messages"}
        </Link>
        {profile.role === "super_admin" && (
          <Link href="/admin" className={`btn btn-ghost w-full ${collapsed ? "justify-center !px-2" : "justify-start"}`} title="Admin Dashboard">
            {collapsed ? "🛠" : "Admin Dashboard"}
          </Link>
        )}
      </nav>

      <BottomProfilePanel profile={profile} collapsed={collapsed} />
    </aside>
  );
}
