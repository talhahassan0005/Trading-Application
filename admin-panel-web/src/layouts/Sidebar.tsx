import { NavLink } from 'react-router-dom';
import { PanelLeft } from 'lucide-react';
import { navItems } from './navConfig';
import { useBadgeCounts } from '../hooks/useBadgeCounts';

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** Nav-only sidebar — brand header and account menu live in TopBar. */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const counts = useBadgeCounts();

  const badgeFor = (path: string) => {
    if (path === '/withdrawals') return counts.withdrawals;
    if (path === '/disputes') return counts.disputes;
    return 0;
  };

  return (
    <aside
      className={`shrink-0 overflow-y-auto overflow-x-hidden border-r border-border bg-surface transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className={`flex p-3 pb-0 ${collapsed ? 'justify-center' : 'justify-end'}`}>
        <button
          onClick={onToggle}
          title="Toggle sidebar"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-alt cursor-pointer"
        >
          <PanelLeft className="h-[18px] w-[18px]" />
        </button>
      </div>

      <nav className="space-y-0.5 p-3">
        {navItems.map((item) => {
          const badge = badgeFor(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                [
                  'relative flex h-10 items-center rounded-lg px-3 text-sm transition-colors',
                  collapsed ? 'justify-center' : 'gap-3',
                  isActive
                    ? 'bg-surface-alt text-ink font-medium'
                    : 'text-ink-secondary hover:bg-surface-alt/60',
                ].join(' ')
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed ? <span className="flex-1">{item.label}</span> : null}
              {badge > 0 ? (
                collapsed ? (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
                ) : (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white ${
                      item.path === '/disputes' ? 'bg-danger' : 'bg-warning'
                    }`}
                  >
                    {badge}
                  </span>
                )
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
