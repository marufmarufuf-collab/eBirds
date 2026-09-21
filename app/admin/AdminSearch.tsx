"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminSearch({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <input
      className="input"
      placeholder="Search users by username or email…"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        router.replace(`${pathname}?q=${encodeURIComponent(e.target.value)}`);
      }}
    />
  );
}
