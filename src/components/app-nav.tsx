"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Image as ImageIcon, Inbox, Megaphone, Sun } from "lucide-react";
import { repo } from "@/lib/data";
import { useRepoQuery } from "@/lib/hooks/use-repo-query";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const items = [
  { href: "/", label: "Hoje", icon: Sun },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/criativos", label: "Criativos", icon: ImageIcon },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/tarefas", label: "Tarefas", icon: CheckSquare },
] as const;

const countInbox = () => repo.countInboxItems();

/**
 * One nav, two layouts: bottom bar below lg, fixed left sidebar from lg up.
 * Keep the sidebar width (w-56) in sync with the `lg:pl-56` in layout.tsx.
 */
export function AppNav() {
  const pathname = usePathname();
  const inbox = useRepoQuery(countInbox);
  const pending = inbox.data ?? 0;

  return (
    <nav
      aria-label="Principal"
      className={cn(
        "fixed z-40 bg-background/95 backdrop-blur",
        "inset-x-0 bottom-0 border-t pb-[env(safe-area-inset-bottom)]",
        "lg:inset-y-0 lg:right-auto lg:flex lg:w-56 lg:flex-col lg:border-t-0 lg:border-r lg:p-3 lg:pb-3",
      )}
    >
      <p className="hidden px-3 pt-2 pb-4 text-sm font-semibold lg:block">Segundo Cérebro</p>

      <ul className="mx-auto grid max-w-xl grid-cols-5 lg:mx-0 lg:flex lg:max-w-none lg:flex-col lg:gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  "lg:h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-lg lg:px-3 lg:text-sm lg:hover:bg-muted",
                  active ? "font-semibold text-foreground lg:bg-muted" : "text-muted-foreground",
                )}
              >
                <Icon className="size-6 lg:size-5" strokeWidth={active ? 2.25 : 1.75} />
                {label}
                {href === "/inbox" && pending > 0 && (
                  <span
                    aria-label={`${pending} por triar`}
                    className="absolute top-2 left-1/2 ml-2 min-w-5 rounded-full bg-destructive px-1 text-center text-[10px] leading-5 font-semibold text-white lg:static lg:top-auto lg:left-auto lg:ml-auto lg:text-xs"
                  >
                    {pending}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto hidden lg:block">
        <ThemeToggle withLabel />
      </div>
    </nav>
  );
}
