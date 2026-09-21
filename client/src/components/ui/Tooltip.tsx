'use client';

import { cloneElement, useEffect, useId, useRef, useState, type ReactElement } from 'react';

/** Supplementary text only; the child must already have an accessible name. */
export function Tooltip({ content, children }: { content: string; children: ReactElement<{ 'aria-describedby'?: string }> }) {
  const id = useId();
  const wrapper = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const show = () => {
    clearTimeout(timer.current);
    const rect = wrapper.current?.getBoundingClientRect();
    if (rect) setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 248)), top: Math.min(rect.bottom + 8, window.innerHeight - 80) });
  };
  const hide = () => { clearTimeout(timer.current); setPosition(null); };
  useEffect(() => {
    const dismiss = () => setPosition(null);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => { clearTimeout(timer.current); window.removeEventListener('scroll', dismiss, true); window.removeEventListener('resize', dismiss); };
  }, []);
  return <span ref={wrapper} className="inline-flex" onPointerEnter={show} onPointerLeave={() => { timer.current = setTimeout(hide, 100); }}
    onFocus={show} onBlur={hide} onKeyDown={(event) => { if (event.key === 'Escape' && position) { event.stopPropagation(); hide(); } }}>
    {cloneElement(children, { 'aria-describedby': [children.props['aria-describedby'], position && id].filter(Boolean).join(' ') || undefined })}
    {position && <span id={id} role="tooltip" className="ui-tooltip" style={position} onPointerEnter={() => clearTimeout(timer.current)}>{content}</span>}
  </span>;
}
