import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
    <header className="mx-auto flex lg:hidden w-full max-w-xl items-center justify-between px-4 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <span className="text-sm font-medium text-muted-foreground">Segundo Cérebro</span>
      <ThemeToggle />
    </header>
  );
}
