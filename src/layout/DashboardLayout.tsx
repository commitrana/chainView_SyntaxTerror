import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Building2, Menu, X, QrCode, Bell, User, LogOut, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Entities', path: '/entities', icon: Building2 },
  { label: 'Employees', path: '/employees', icon: User },
  { label: 'Route Steps', path: '/route-steps', icon: MapPin }, // Added this line
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('Current user:', user);
        
        // Set initial data from auth user immediately
        const initialUserData = {
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Admin User',
          email: user.email || 'No email',
        };
        setUserData(initialUserData);
        
        // Try to get from admin table
        const { data: adminData, error } = await supabase
          .from('admin')
          .select('name, email, phone_number')
          .eq('id', user.id)
          .maybeSingle();
        
        if (adminData) {
          console.log('Admin data found:', adminData);
          setUserData(adminData);
        } else {
          console.log('No admin data found, using metadata');
          
          // Try to create admin record
          if (user.user_metadata?.name) {
            const { error: insertError } = await supabase
              .from('admin')
              .insert([
                {
                  id: user.id,
                  name: user.user_metadata.name,
                  email: user.email,
                  phone_number: user.user_metadata.phone_number || null,
                }
              ])
              .select();
            
            if (insertError) {
              console.log('Could not create admin record:', insertError);
            } else {
              console.log('Admin record created successfully');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Show a minimal layout while loading to avoid blank screen
  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-sidebar">
          <div className="flex h-16 items-center gap-2.5 border-b border-border px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <QrCode className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-semibold text-foreground">ChainView</span>
          </div>
          <div className="flex-1 px-3 py-4">
            {/* Skeleton loading state for nav items */}
            {[1, 2, 3, 4, 5].map((i) => ( // Updated from 4 to 5 items
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded bg-muted animate-pulse mb-2" />
                <div className="h-3 w-32 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="flex h-16 items-center border-b border-border px-4 lg:px-8">
            <div className="h-5 w-5 rounded bg-muted animate-pulse" />
          </header>
          <main className="flex-1 p-4 lg:p-8">
            <div className="h-32 rounded-lg bg-muted animate-pulse" />
          </main>
        </div>
      </div>
    );
  }

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
              <p className="truncate text-sm font-medium text-foreground">
                {userData?.name || 'Admin User'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {userData?.email || 'admin@chainview.io'}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
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