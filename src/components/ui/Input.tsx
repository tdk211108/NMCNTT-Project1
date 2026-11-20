import { useId, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  id,
  className = '',
  required,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-help`;
  const describedBy = [error ? errorId : null, helperText ? helperId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-1 text-danger">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`min-h-11 w-full rounded-control border bg-surface-elevated/90 px-3.5 py-2 text-base text-ink shadow-[inset_0_1px_2px_rgba(15,23,42,0.06),inset_0_-1px_0_var(--aero-specular)] placeholder:text-ink-muted transition-[border-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? 'border-danger' : 'border-border-strong'
        } ${className}`}
        {...rest}
      />
      {helperText ? (
        <p id={helperId} className="text-xs text-ink-muted">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
