"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  {href: "/", label: "Start"},
  {href: "/tysiac", label: "Stoły"},
  {href: "/turnieje", label: "Turnieje"},
  {href: "/rankingi", label: "Rankingi"},
  {href: "/statystyki", label: "Statystyki"},
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-yellow-700/30 bg-black/60 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black text-yellow-400">♠</span>
          <span className="text-xl font-black tracking-tight text-white">
            CARD<span className="text-yellow-400">ARENA</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-yellow-500/15 text-yellow-300"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-yellow-700/40 bg-black/40 px-3 py-1.5 sm:flex">
            <span className="text-yellow-400">◆</span>
            <span className="text-sm font-bold text-white">1 250</span>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-500"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-black/20 text-xs">
              TY
            </span>
            Gość
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-yellow-500/15 text-yellow-300"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
