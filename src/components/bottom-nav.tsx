"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Image as ImageIcon, Inbox, Megaphone, Sun } from "lucide-react";
import { repo } from "@/lib/data";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Hoje", icon: Sun },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/criativos", label: "Criativos", icon: ImageIcon },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/tarefas", label: "Tarefas", icon: CheckSquare },
] as const;

const countInbox = () => repo.countInboxItems();

export function BottomNav() {
  const pathname = usePathname();
  const inbox = useRepoQuery(countInbox);
  const pending = inbox.data ?? 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.25 : 1.75} />
                {label}
                {href === "/inbox" && pending > 0 && (
                  <span className="absolute top-2 left-1/2 ml-2 min-w-5 rounded-full bg-destructive px-1 text-center text-[10px] leading-5 font-semibold text-white">
                    {pending}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
