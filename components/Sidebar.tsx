"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BottomProfilePanel from "./BottomProfilePanel";
import { HomeIcon, MessagesIcon, AdminIcon, SidebarToggleIcon } from "./icons";
import type { Profile } from "@/types/database";

const STORAGE_KEY = "sidebar-collapsed";

const NAV = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/messages", label: "Messages", Icon: MessagesIcon },
] as const;

export default function Sidebar({ profile }: { profile: Profile }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

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

  function isActive(href: string) {
    return href === "/home" ? pathname === "/home" : pathname.startsWith(href);
  }

  function navClass(href: string) {
    const active = isActive(href);
    return `flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
      collapsed ? "justify-center !px-2" : ""
    } ${
      active
        ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]"
        : "text-[var(--ink-soft)] hover:bg-[var(--surface-2)]"
    }`;
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
      <div className={`h-16 px-4 border-b flex items-center ${collapsed ? "justify-center" : ""}`}>
        <Link href="/home" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={collapsed ? "/logo-icon.png" : "/logo-full.png"}
            alt="eBirds"
            className={collapsed ? "h-7 w-7 object-contain" : "h-7 w-auto object-contain"}
          />
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={navClass(href)} title={label}>
            <Icon className={isActive(href) ? "text-[var(--accent-dark)]" : ""} />
            {!collapsed && label}
          </Link>
        ))}
        {profile.role === "super_admin" && (
          <Link href="/admin" className={navClass("/admin")} title="Admin Dashboard">
            <AdminIcon className={isActive("/admin") ? "text-[var(--accent-dark)]" : ""} />
            {!collapsed && "Admin Dashboard"}
          </Link>
        )}
      </nav>

      {/* Collapse/expand toggle, bottom of the rail — same spot and icon
          style as ChatGPT's sidebar toggle. */}
      <div className={`p-3 border-t flex ${collapsed ? "justify-center" : "justify-start"}`}>
        <button
          type="button"
          onClick={toggle}
          className="btn btn-ghost !px-2"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <SidebarToggleIcon />
        </button>
      </div>

      <BottomProfilePanel profile={profile} collapsed={collapsed} />
    </aside>
  );
}
