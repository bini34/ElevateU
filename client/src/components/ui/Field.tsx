'use client';

import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';

type FieldProps = { label: string; description?: ReactNode; error?: string; id?: string; required?: boolean };
type Adornments = { leftIcon?: ReactNode; rightAction?: ReactNode };

function FieldFrame({ label, description, error, id, required, children }: FieldProps & { children: ReactNode }) {
  return <div className="ui-field">
    <label htmlFor={id} className="text-label">{label}{required && <span aria-hidden="true" className="text-danger"> *</span>}</label>
    {children}
    {description && <p id={`${id}-hint`} className="text-caption text-text-muted">{description}</p>}
    {error && <p id={`${id}-error`} role="alert" className="text-caption text-danger">{error}</p>}
  </div>;
}

function describedBy(id: string, description: ReactNode, error?: string, supplied?: string) {
  return [supplied, description && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps & Adornments>(
  function Input({ label, description, error, id: suppliedId, leftIcon, rightAction, className, required, ...props }, ref) {
    const generatedId = useId();
    const id = suppliedId ?? generatedId;
    return <FieldFrame {...{ label, description, error, id, required }}>
      <div className="ui-input-wrap">
        {leftIcon && <span className="ui-input-icon" aria-hidden="true">{leftIcon}</span>}
        <input {...props} ref={ref} id={id} required={required} aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={describedBy(id, description, error, props['aria-describedby'])}
          className={cx('ui-control', Boolean(leftIcon) && 'ui-control-leading', Boolean(rightAction) && 'ui-control-trailing', className)} />
        {rightAction && <span className="ui-input-action">{rightAction}</span>}
      </div>
    </FieldFrame>;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(
  function Textarea({ label, description, error, id: suppliedId, className, required, rows = 4, ...props }, ref) {
    const generatedId = useId();
    const id = suppliedId ?? generatedId;
    return <FieldFrame {...{ label, description, error, id, required }}>
      <textarea {...props} ref={ref} id={id} required={required} rows={rows} aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={describedBy(id, description, error, props['aria-describedby'])} className={cx('ui-control', className)} />
    </FieldFrame>;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(
  function Select({ label, description, error, id: suppliedId, className, required, children, ...props }, ref) {
    const generatedId = useId();
    const id = suppliedId ?? generatedId;
    return <FieldFrame {...{ label, description, error, id, required }}>
      <select {...props} ref={ref} id={id} required={required} aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={describedBy(id, description, error, props['aria-describedby'])} className={cx('ui-control', className)}>{children}</select>
    </FieldFrame>;
  },
);
