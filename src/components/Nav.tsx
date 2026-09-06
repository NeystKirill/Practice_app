"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Обзор" },
  { href: "/review", label: "Повторение" },
  { href: "/words", label: "Словарь" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto flex w-full max-w-3xl items-center gap-1 px-4 py-3">
        <Link href="/" className="mr-3 font-semibold tracking-tight">
          🇬🇧 Practice
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
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
