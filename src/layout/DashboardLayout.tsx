import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Building2, Menu, X, QrCode, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Entities', path: '/entities', icon: Building2 },
  { label: 'Employees', path: '/employees', icon: User },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-sidebar lg:static lg:z-auto',
          'transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <QrCode className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-semibold text-foreground">ChainView</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">Admin User</p>
              <p className="truncate text-xs text-muted-foreground">admin@chainview.io</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-border px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
