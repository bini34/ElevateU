'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingLabel?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary', size = 'md', loading = false, loadingLabel, disabled,
  className, children, type = 'button', ...props
}, ref) {
  return <button {...props} ref={ref} type={type} disabled={disabled || loading}
    aria-busy={loading || undefined} className={cx('ui-button', `ui-button-${variant}`, `ui-button-${size}`, className)}>
    {loading && <span className="ui-spinner" aria-hidden="true" />}
    {loading && loadingLabel ? loadingLabel : children}
  </button>;
});

export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'aria-label' | 'loadingLabel'> & { label: string }>(
  function IconButton({ label, children, className, variant = 'ghost', loading, ...props }, ref) {
    return <Button {...props} ref={ref} variant={variant} loading={loading} aria-label={label}
      className={cx('ui-icon-button', className)}>
      {!loading && <span aria-hidden="true">{children}</span>}
    </Button>;
  },
);
