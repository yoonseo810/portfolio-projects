import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

/** Native checkbox (keyboard, forms and indeterminate all work) with the system's look. */
export function Checkbox({
  label,
  description,
  className,
  id,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode; description?: ReactNode }) {
  const auto = useId();
  const fieldId = id ?? auto;
  const descId = description ? `${fieldId}-desc` : undefined;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={fieldId}
        type="checkbox"
        aria-describedby={descId}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line-strong accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-55"
        {...props}
      />
      <div className="text-sm">
        <label htmlFor={fieldId} className="cursor-pointer font-medium text-fg">
          {label}
        </label>
        {description && (
          <p id={descId} className="text-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
