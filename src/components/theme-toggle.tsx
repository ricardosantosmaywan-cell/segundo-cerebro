"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Private mode: the choice just won't persist.
    }
  }

  // Both icons are rendered and CSS picks one, so server and client markup match.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Mudar tema claro/escuro"
      className={cn(
        "flex items-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        withLabel ? "h-11 w-full gap-3 rounded-lg px-3 text-sm" : "size-11 justify-center",
      )}
    >
      <Moon className="size-5 dark:hidden" />
      <Sun className="hidden size-5 dark:block" />
      {withLabel && <span>Tema</span>}
    </button>
  );
}
