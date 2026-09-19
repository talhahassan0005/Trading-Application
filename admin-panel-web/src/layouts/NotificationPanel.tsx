import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { markAllNotificationsRead, markNotificationRead } from '../api/adminService';
import type { NotificationItem } from '../types/models';
import { Text, Divider, EmptyState } from '../components';
import { dotColorForActivity } from '../utils/activity';

export interface NotificationPanelProps {
  data: NotificationItem[];
  setData: Dispatch<SetStateAction<NotificationItem[]>>;
  onClose: () => void;
}

/** Dropdown rendered under the bell icon in TopBar. */
export function NotificationPanel({ data, setData, onClose }: NotificationPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const unreadCount = data.filter((n) => !n.read).length;

  const markAll = async () => {
    await markAllNotificationsRead();
    setData((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOne = async (id: string) => {
    await markNotificationRead(id);
    setData((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-11 z-40 w-80 origin-top-right rounded-xl border border-border bg-card shadow-2xl animate-slide-down"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <Text variant="sectionTitle">Notifications</Text>
        {unreadCount > 0 ? (
          <button
            onClick={markAll}
            className="text-xs font-medium text-accent hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
        ) : null}
      </div>
      <Divider />

      <div className="max-h-96 overflow-y-auto">
        {data.length === 0 ? (
          <EmptyState title="No notifications" />
        ) : (
          data.map((n, idx) => (
            <div key={n.id}>
              {idx > 0 ? <Divider className="mx-4" /> : null}
              <button
                onClick={() => markOne(n.id)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors duration-150 hover:bg-surface-alt/60 ${
                  n.read ? '' : 'bg-accent-soft'
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    n.read ? 'bg-transparent' : dotColorForActivity(n.type)
                  }`}
                />
                <div className="flex-1">
                  <Text variant={n.read ? 'body' : 'bodyMedium'}>{n.title}</Text>
                  <Text variant="caption" color="text-ink-muted" className="mt-0.5">
                    {n.subtitle}
                  </Text>
                </div>
                <Text variant="caption" color="text-ink-muted" className="shrink-0">
                  {n.timeAgo}
                </Text>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
