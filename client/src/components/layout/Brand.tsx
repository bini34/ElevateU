import Link from 'next/link';
import { MoveUpRight } from 'lucide-react';

export function Brand() {
  return <Link href="/" className="app-brand" aria-label="ElevateU home"><span className="app-brand-mark"><MoveUpRight size={22} aria-hidden="true" /></span><span className="app-brand-word">ElevateU<span className="text-focus">.</span></span></Link>;
}
