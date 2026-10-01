import { useId } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const control =
  "h-12 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

type FieldProps = { label: string; error?: string; hint?: string };

function Field({ label, error, hint, id, children }: FieldProps & { id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = Omit<React.ComponentProps<"input">, "id" | "className"> & FieldProps;

/** Use type="date", type="number" (with inputMode="decimal") or type="url" for the right keyboard. */
export function TextField({ label, error, hint, ...props }: InputProps) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-12 text-base"
        {...props}
      />
    </Field>
  );
}

export function TextArea({
  label,
  error,
  hint,
  ...props
}: Omit<React.ComponentProps<"textarea">, "id" | "className"> & FieldProps) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        className={cn(control, "h-auto py-2.5")}
        {...props}
      />
    </Field>
  );
}

export function SelectField({
  label,
  error,
  hint,
  options,
  ...props
}: Omit<React.ComponentProps<"select">, "id" | "className" | "children"> &
  FieldProps & { options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <select id={id} aria-invalid={error ? true : undefined} className={control} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
