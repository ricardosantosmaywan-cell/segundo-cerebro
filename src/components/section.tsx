import { cn } from "@/lib/utils";

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-4 text-2xl font-semibold tracking-tight">{children}</h1>;
}

export function Section({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-6", className)}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">{children}</p>;
}

export function Loading() {
  return <p className="py-6 text-sm text-muted-foreground">A carregar…</p>;
}

export function LoadError({ error }: { error: Error }) {
  return (
    <p className="rounded-lg bg-destructive/10 px-3 py-4 text-sm text-destructive">
      Erro ao ler os dados: {error.message}
    </p>
  );
}
