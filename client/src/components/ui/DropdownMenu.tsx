'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from './Button';

type MenuItem = { id: string; label: string; onSelect: () => void; disabled?: boolean; danger?: boolean };

export function DropdownMenu({ label, items, icon }: { label: string; items: readonly MenuItem[]; icon?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const startAtEnd = useRef(false);
  const buttons = () => Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const options = buttons();
    ((startAtEnd.current ? options.at(-1) : options[0]) ?? menu.current)?.focus();
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const keyDown = (event: KeyboardEvent) => {
    const options = buttons();
    const position = options.indexOf(document.activeElement as HTMLButtonElement);
    let next: HTMLButtonElement | undefined;
    if (event.key === 'ArrowDown') next = options[(position + 1) % options.length];
    if (event.key === 'ArrowUp') next = options[(position - 1 + options.length) % options.length];
    if (event.key === 'Home') next = options[0];
    if (event.key === 'End') next = options.at(-1);
    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey && event.key !== ' ') {
      next = [...options.slice(position + 1), ...options.slice(0, position + 1)].find((item) => item.textContent?.toLowerCase().startsWith(event.key.toLowerCase()));
    }
    if (next) { event.preventDefault(); next.focus(); }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key === 'Tab') close();
  };
  return <div ref={root} className="ui-dropdown">
    <Button ref={trigger} id={`${id}-trigger`} variant="outline" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => { startAtEnd.current = false; setOpen(!open); }}
      onKeyDown={(event) => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); startAtEnd.current = event.key === 'ArrowUp'; setOpen(true); } }}>
      {icon && <span aria-hidden="true">{icon}</span>}{label}<ChevronDown size={16} aria-hidden="true" />
    </Button>
    {open && <div ref={menu} id={id} role="menu" tabIndex={-1} aria-labelledby={`${id}-trigger`} className="ui-menu" onKeyDown={keyDown}>
      {items.map((item) => <button key={item.id} type="button" role="menuitem" tabIndex={-1} disabled={item.disabled}
        className={`ui-menu-item${item.danger ? ' text-danger' : ''}`} onClick={() => { close(); item.onSelect(); }}>{item.label}</button>)}
    </div>}
  </div>;
}
