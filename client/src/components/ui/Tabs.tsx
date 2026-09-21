'use client';

import { useId, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';
import { cx } from './cx';

type TabItem = { id: string; label: string; content: ReactNode; disabled?: boolean };
export function Tabs({ label, items, value, defaultValue, onValueChange, className }: {
  label: string; items: readonly TabItem[]; value?: string; defaultValue?: string;
  onValueChange?: (value: string) => void; className?: string;
}) {
  const id = useId();
  const [internal, setInternal] = useState(defaultValue);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = items.find((item) => item.id === (value ?? internal) && !item.disabled)?.id ?? items.find((item) => !item.disabled)?.id;
  const select = (next: string) => { if (value === undefined) setInternal(next); onValueChange?.(next); };
  const keyDown = (event: KeyboardEvent, index: number) => {
    const enabled = items.map((item, i) => item.disabled ? -1 : i).filter((i) => i >= 0);
    const position = enabled.indexOf(index);
    let next: number | undefined;
    if (event.key === 'ArrowRight') next = enabled[(position + 1) % enabled.length];
    if (event.key === 'ArrowLeft') next = enabled[(position - 1 + enabled.length) % enabled.length];
    if (event.key === 'Home') next = enabled[0];
    if (event.key === 'End') next = enabled.at(-1);
    if (next !== undefined) { event.preventDefault(); refs.current[next]?.focus(); }
  };
  return <div className={className}>
    <div role="tablist" aria-label={label} className="ui-tabs-list">
      {items.map((item, index) => <button key={item.id} type="button" role="tab" id={`${id}-tab-${index}`}
        aria-controls={`${id}-panel-${index}`} aria-selected={item.id === selected} tabIndex={item.id === selected ? 0 : -1}
        disabled={item.disabled} ref={(element) => { refs.current[index] = element; }} onKeyDown={(event) => keyDown(event, index)}
        onFocus={() => select(item.id)} onClick={() => { if (selected !== item.id) select(item.id); }} className="ui-tab">{item.label}</button>)}
    </div>
    {items.map((item, index) => <div key={item.id} id={`${id}-panel-${index}`} role="tabpanel"
      aria-labelledby={`${id}-tab-${index}`} hidden={item.id !== selected} tabIndex={0} className={cx('ui-tab-panel', item.id !== selected && 'hidden')}>
      {item.content}
    </div>)}
  </div>;
}
