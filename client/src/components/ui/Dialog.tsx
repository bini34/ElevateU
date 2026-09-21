'use client';

import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { cx } from './cx';

export type DialogProps = {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string;
  children: ReactNode; initialFocusRef?: RefObject<HTMLElement>; className?: string;
};

let scrollLocks = 0;
let originalOverflow = '';

function Dialog({ open, onOpenChange, title, description, children, initialFocusRef, className, drawer = false }: DialogProps & { drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const backdropPress = useRef(false);
  const programmaticCloses = useRef({ count: 0 });
  useEffect(() => {
    const dialog = ref.current;
    const pendingCloses = programmaticCloses.current;
    if (!open || !dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (scrollLocks++ === 0) { originalOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    dialog.showModal();
    initialFocusRef?.current?.focus();
    return () => {
      if (dialog.open) { pendingCloses.count++; dialog.close(); }
      if (--scrollLocks === 0) document.body.style.overflow = originalOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open, initialFocusRef]);
  return <dialog ref={ref} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
    className={cx('ui-dialog', drawer && 'ui-drawer', className)}
    onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex], [contenteditable="true"]'))
        .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled, [inert], [inert] *') && element.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      // Keep the cycle within the content instead of stepping into browser chrome.
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}
    onCancel={(event) => { event.preventDefault(); onOpenChange(false); }}
    onClose={() => { if (programmaticCloses.current.count > 0) { programmaticCloses.current.count--; return; } if (open) onOpenChange(false); }}
    onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget; }}
    onClick={(event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (backdropPress.current && event.target === event.currentTarget &&
        (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) onOpenChange(false);
    }}>
    <div className="ui-dialog-header"><div><h2 id={`${id}-title`} className="text-h2">{title}</h2>
      {description && <p id={`${id}-description`} className="mt-2 text-body-small text-text-muted">{description}</p>}</div>
      <IconButton label={`Close ${title}`} onClick={() => onOpenChange(false)}><X size={20} /></IconButton>
    </div>
    <div className="ui-dialog-content">{children}</div>
  </dialog>;
}

export function Modal(props: DialogProps) { return <Dialog {...props} />; }
export function Drawer(props: DialogProps) { return <Dialog {...props} drawer />; }
