"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabBar() {
  const path = usePathname();
  const tab = (href: string, label: string) => (
    <Link
      href={href}
      className={`flex-1 py-3 text-center font-mono text-xs ${
        path === href ? "text-zinc-200" : "text-zinc-600"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 mx-auto flex max-w-xl border-t border-zinc-900 bg-zinc-950">
      {tab("/", "stream")}
      {tab("/todos", "todos")}
    </nav>
  );
}