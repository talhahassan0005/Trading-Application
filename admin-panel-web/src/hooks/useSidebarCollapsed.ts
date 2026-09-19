import { useEffect, useState } from 'react';

const STORAGE_KEY = 'vertex_admin.sidebar_collapsed';

/** Sidebar open/collapsed state, persisted across reloads. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return { collapsed, toggle: () => setCollapsed((c) => !c) };
}
