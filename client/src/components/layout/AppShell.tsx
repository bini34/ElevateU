import type { ReactNode } from 'react';
import { Brand } from './Brand';

export function AppShell({ navigation, mobileNavigation, account, footer, rightRail, children }: {
  navigation: ReactNode; mobileNavigation: ReactNode; account?: ReactNode; footer?: ReactNode; rightRail?: ReactNode; children: ReactNode;
}) {
  return <div className="app-shell-root">
    <a className="app-skip-link" href="#app-content">Skip to content</a>
    <header className="app-mobile-header"><Brand />{account}</header>
    <div className="app-frame">
      <aside className="app-sidebar"><Brand /><nav aria-label="Main navigation">{navigation}</nav>
        <div className="app-sidebar-footer">{footer}{account}<p className="app-tagline">Small steps.<br />Meaningful growth.</p></div>
      </aside>
      <div className="app-content-group"><div id="app-content" tabIndex={-1} className="app-content">{children}</div>
        {rightRail && <aside className="app-context-rail" aria-label="Context">{rightRail}</aside>}
      </div>
    </div>
    <nav className="app-mobile-nav" aria-label="Mobile navigation">{mobileNavigation}</nav>
  </div>;
}
