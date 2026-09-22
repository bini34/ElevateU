'use client';

import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Field';
import { IconButton } from './Button';

export function PasswordInput(props: Omit<ComponentProps<typeof Input>, 'type' | 'rightAction'>) {
  const [visible, setVisible] = useState(false);
  const action = `${visible ? 'Hide' : 'Show'} ${props.label.toLowerCase()}`;
  return <Input {...props} type={visible ? 'text' : 'password'} rightAction={<IconButton label={action} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</IconButton>} />;
}
