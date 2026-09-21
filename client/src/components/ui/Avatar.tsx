'use client';

import Image from 'next/image';
import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { cx } from './cx';

const pixels = { sm: 32, md: 40, lg: 56, xl: 80 };

export function Avatar({ name, src, size = 'md', online, className }: {
  name: string; src?: string | null; size?: keyof typeof pixels; online?: boolean; className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join('').toLocaleUpperCase();
  return <span role="img" aria-label={`${name || 'Member'}${online === undefined ? '' : online ? ', online' : ', offline'}`}
    style={{ width: pixels[size], height: pixels[size] }} className={cx('ui-avatar', `ui-avatar-${size}`, className)}>
    <span aria-hidden="true">{initials || <UserRound size={20} />}</span>
    {src && src !== failedSrc && <Image src={src} alt="" width={pixels[size]} height={pixels[size]}
      className="absolute inset-0 h-full w-full rounded-full object-cover" onError={() => setFailedSrc(src)} />}
    {online !== undefined && <span aria-hidden="true" className={cx('ui-online', online && 'ui-online-active')} />}
  </span>;
}
