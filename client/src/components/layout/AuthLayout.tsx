import type { ReactNode } from 'react';
import { Brand } from './Brand';

function GrowthArtwork() {
  return <svg viewBox="0 0 360 240" className="auth-artwork" aria-hidden="true" fill="none">
    <circle cx="286" cy="44" r="30" fill="rgb(var(--pastel-yellow))" />
    <path d="M30 212V160Q30 144 46 144H110V212" fill="rgb(var(--pastel-mint))" stroke="currentColor" strokeWidth="2" />
    <path d="M110 212V108Q110 92 126 92H206V212" fill="rgb(var(--primary))" stroke="currentColor" strokeWidth="2" />
    <path d="M206 212V54Q206 38 222 38H302Q318 38 318 54V212" fill="rgb(var(--pastel-peach))" stroke="currentColor" strokeWidth="2" />
    <path d="M18 212H340M159 91V42M159 67Q129 67 129 40Q159 40 159 67ZM159 54Q189 54 189 26Q159 26 159 54Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function AuthBrandPanel() {
  return <section className="auth-brand-panel" aria-label="About ElevateU"><Brand />
    <div className="auth-brand-copy"><p className="text-caption font-semibold uppercase tracking-widest text-text-muted">Grow at your own pace</p><h2 className="mt-4 text-display">Small steps.<br />A better you.</h2><p className="mt-4 max-w-xs text-body-small text-text-muted">A place for progress, encouragement, and showing up for yourself.</p><p className="mt-6 text-label">Find your community.<br />Share encouragement.<br />Make space for growth.</p></div><GrowthArtwork />
  </section>;
}

export function AuthLayout({ title, description, children, footer, headerAction }: { title: string; description?: string; children: ReactNode; footer?: ReactNode; headerAction?: ReactNode }) {
  return <div className="auth-foundation"><AuthBrandPanel /><section className="auth-form-panel"><div className="w-full max-w-sm">{headerAction && <div className="mb-8 text-body-small text-text-muted">{headerAction}</div>}<h1 className="text-h1">{title}</h1>{description && <p className="mt-3 text-body-small text-text-muted">{description}</p>}<div className="mt-8">{children}</div>{footer && <div className="mt-8 text-body-small text-text-muted">{footer}</div>}</div></section></div>;
}
