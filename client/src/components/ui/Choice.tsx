'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cx } from './cx';

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string; description?: string };

const Choice = forwardRef<HTMLInputElement, ChoiceProps & { kind: 'checkbox' | 'radio' | 'switch' }>(
  function Choice({ label, description, kind, id: suppliedId, className, ...props }, ref) {
    const generatedId = useId();
    const id = suppliedId ?? generatedId;
    return <label htmlFor={id} className={cx('ui-choice', props.disabled && 'ui-choice-disabled', className)}>
      <input {...props} ref={ref} id={id} type={kind === 'radio' ? 'radio' : 'checkbox'}
        role={kind === 'switch' ? 'switch' : undefined} className={cx('ui-choice-input', `ui-choice-${kind}`)}
        aria-describedby={[props['aria-describedby'], description && `${id}-description`].filter(Boolean).join(' ') || undefined} />
      <span><span className="block text-label">{label}</span>
        {description && <span id={`${id}-description`} className="block text-caption text-text-muted">{description}</span>}
      </span>
    </label>;
  },
);

export const Checkbox = forwardRef<HTMLInputElement, ChoiceProps>((props, ref) => <Choice {...props} ref={ref} kind="checkbox" />);
export const Radio = forwardRef<HTMLInputElement, ChoiceProps>((props, ref) => <Choice {...props} ref={ref} kind="radio" />);
export const Switch = forwardRef<HTMLInputElement, ChoiceProps>((props, ref) => <Choice {...props} ref={ref} kind="switch" />);
Checkbox.displayName = 'Checkbox';
Radio.displayName = 'Radio';
Switch.displayName = 'Switch';
