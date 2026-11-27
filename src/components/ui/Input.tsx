import { useId, type ComponentProps, type ReactNode } from 'react';

export interface InputProps extends ComponentProps<'input'> {
  label?: string;
  error?: string;
  helperText?: string;
  endAdornment?: ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  endAdornment,
  id,
  className = '',
  required,
  ref,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-help`;
  const describedBy = [error ? errorId : null, helperText ? helperId : null]
    .filter(Boolean)
    .join(' ');

  const inputElement = (
    <input
      ref={ref}
      id={inputId}
      required={required}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy || undefined}
      className={`min-h-11 w-full rounded-control border-2 bg-surface py-2 pl-3 text-base text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-50 ${
        endAdornment ? 'pr-14' : 'pr-3'
      } ${error ? 'border-danger' : 'border-border-strong'} ${className}`}
      {...rest}
    />
  );

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
      {endAdornment ? (
        <div className="relative flex items-center">
          {inputElement}
          {endAdornment}
        </div>
      ) : (
        inputElement
      )}
      {helperText ? (
        <p id={helperId} className="text-xs text-ink-muted">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
