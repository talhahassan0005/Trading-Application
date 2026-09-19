import { useState } from 'react';
import { Sun, Moon, Bell, LogOut } from 'lucide-react';
import { Text, Avatar } from '../components';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { fetchNotifications } from '../api/adminService';
import { NotificationPanel } from './NotificationPanel';

/**
 * Persistent header used across every screen — brand identity on the left,
 * theme toggle / notifications / account on the right. Spans the full
 * width, above both the sidebar and the content area.
 */
export function TopBar() {
  const { isDark, toggle } = useTheme();
  const { admin, signOut } = useAuth();
  const { data: notifications, setData: setNotifications } = useAsyncData(fetchNotifications, []);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
          <Sun className="h-4 w-4 text-white" />
        </div>
        <Text variant="sectionTitle">Vertex Admin</Text>
        <span className="ml-1 rounded-full bg-surface-alt px-2 py-0.5 text-[11px] text-ink-secondary">
          internal
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-all duration-150 hover:bg-surface-alt hover:text-ink active:scale-90 cursor-pointer"
          title="Toggle theme"
        >
          {isDark ? (
            <Moon key="moon" className="h-[18px] w-[18px] animate-pop-in" />
          ) : (
            <Sun key="sun" className="h-[18px] w-[18px] animate-pop-in" />
          )}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-all duration-150 hover:bg-surface-alt hover:text-ink active:scale-90 cursor-pointer"
          >
            <Bell className="h-[18px] w-[18px] origin-top transition-transform duration-300 group-hover:rotate-[14deg]" />
            {unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface animate-pulse-soft" />
            ) : null}
          </button>
          {showNotifications ? (
            <NotificationPanel
              data={notifications}
              setData={setNotifications}
              onClose={() => setShowNotifications(false)}
            />
          ) : null}
        </div>

        <div className="mx-2 flex items-center gap-2.5 border-l border-border pl-3">
          <Avatar name={admin?.name ?? '?'} size="sm" />
          <div className="hidden sm:block">
            <Text variant="bodyMedium" className="leading-tight">
              {admin?.name}
            </Text>
            <Text variant="caption" color="text-ink-muted">
              {admin?.role}
            </Text>
          </div>
          <button
            onClick={signOut}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-all duration-150 hover:bg-danger-bg hover:text-danger active:scale-90 cursor-pointer"
            title="Log out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
