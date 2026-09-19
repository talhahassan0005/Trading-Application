import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed';

export function AdminLayout() {
  const { collapsed, toggle } = useSidebarCollapsed();

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
