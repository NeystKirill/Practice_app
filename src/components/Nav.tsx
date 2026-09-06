"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const LINKS = [
  { href: "/", label: "Обзор" },
  { href: "/review", label: "Повторение" },
  { href: "/words", label: "Словарь" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [due, setDue] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      api
        .getStats()
        .then((s) => {
          if (alive) setDue(s.due);
        })
        .catch(() => {});
    refresh();
    window.addEventListener("practice:refresh", refresh);
    return () => {
      alive = false;
      window.removeEventListener("practice:refresh", refresh);
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-3xl items-center gap-1 px-4 py-2.5">
        <Link
          href="/"
          className="mr-2 flex items-center gap-1.5 text-[15px] font-semibold tracking-tight"
        >
          <span aria-hidden>📖</span> Practice
        </Link>
        {LINKS.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`relative rounded-md px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-elevated hover:text-foreground"
              }`}
            >
              {link.label}
              {link.href === "/review" && due != null && due > 0 && (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-4 text-accent-contrast tabular-nums">
                  {due}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
