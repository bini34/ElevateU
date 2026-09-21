import Link from 'next/link';
import { isActiveRoute, type NavigationItem } from './navigation';

export function NavigationList({ items, pathname, mobile = false }: { items: NavigationItem[]; pathname: string; mobile?: boolean }) {
  return <ul className={mobile ? 'app-bottom-list' : 'app-nav-list'}>{items.map(({ href, label, shortLabel, icon: Icon, badge }) =>
    <li key={href}><Link href={href} className="app-nav-link" aria-current={isActiveRoute(pathname, href) ? 'page' : undefined}
      aria-label={badge && badge > 0 ? `${label}, ${badge} unread` : label} title={label}>
      <span className="app-nav-icon"><Icon size={22} aria-hidden="true" />{!!badge && badge > 0 && <span className="app-nav-badge" aria-hidden="true">{badge > 99 ? '99+' : badge}</span>}</span>
      <span className="app-nav-label">{mobile ? shortLabel || label : label}</span>
    </Link></li>)}</ul>;
}
