"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WalletConnect } from "./WalletConnect";
import { Trophy, User, LayoutGrid, Calendar } from "lucide-react";

const NAV_ITEMS = [
  { href: "/quests", label: "Quests", icon: LayoutGrid },
  { href: "/matches", label: "Matches", icon: Calendar },
  { href: "/leaderboard", label: "Fan Wars", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl flex items-center h-16 px-4 gap-2">
        <div className="flex flex-1 justify-start min-w-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Image src="/xetrius_logo.png" alt="Xetrius" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-bold tracking-tight">Xetrius</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center justify-center gap-1 shrink-0">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-white/10 text-white" : "text-muted hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-1 justify-end min-w-0">
          <WalletConnect />
        </div>
      </div>

      <div className="md:hidden flex items-center justify-around border-t border-white/5 py-2 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                active ? "text-accent" : "text-muted"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
