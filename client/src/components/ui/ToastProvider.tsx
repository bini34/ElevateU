'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return <Toaster position="top-center" containerStyle={{ top: 'max(16px, env(safe-area-inset-top))' }} toastOptions={{
    className: 'ui-toast', duration: 4500,
    ariaProps: { role: 'status', 'aria-live': 'polite' },
    success: { iconTheme: { primary: 'rgb(var(--success))', secondary: 'rgb(var(--surface))' } },
    error: { duration: 6000, iconTheme: { primary: 'rgb(var(--danger))', secondary: 'rgb(var(--surface))' } },
  }} />;
}
