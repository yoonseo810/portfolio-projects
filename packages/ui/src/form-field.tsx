import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";
import { fieldClass } from "./field";

type Shared = {
  label: ReactNode;
  /** Help text under the label, read by screen readers with the field. */
  hint?: ReactNode;
  /** Error message; marks the field invalid and replaces nothing else. */
  error?: ReactNode;
  className?: string;
};

/**
 * Wires a label, hint and error to one control with the right ids and ARIA,
 * so every form in every app gets it right by default.
 */
function useFieldIds(id: string | undefined, hint: ReactNode, error: ReactNode) {
  const auto = useId();
  const fieldId = id ?? auto;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { fieldId, hintId, errorId, describedBy };
}

function Frame({
  fieldId,
  hintId,
  errorId,
  label,
  hint,
  error,
  required,
  className,
  children,
}: Shared & { fieldId: string; hintId?: string; errorId?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={fieldId} className="text-sm font-medium text-fg">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-danger">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: Shared & Omit<InputHTMLAttributes<HTMLInputElement>, "className">) {
  const ids = useFieldIds(id, hint, error);
  return (
    <Frame {...ids} label={label} hint={hint} error={error} required={props.required} className={className}>
      <input
        id={ids.fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={fieldClass()}
        {...props}
      />
    </Frame>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: Shared & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">) {
  const ids = useFieldIds(id, hint, error);
  return (
    <Frame {...ids} label={label} hint={hint} error={error} required={props.required} className={className}>
      <textarea
        id={ids.fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={fieldClass("leading-relaxed")}
        {...props}
      />
    </Frame>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  id,
  options,
  ...props
}: Shared &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "children"> & {
    options: Array<{ value: string; label: string; disabled?: boolean }>;
  }) {
  const ids = useFieldIds(id, hint, error);
  return (
    <Frame {...ids} label={label} hint={hint} error={error} required={props.required} className={className}>
      <select
        id={ids.fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={fieldClass()}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </Frame>
  );
}
