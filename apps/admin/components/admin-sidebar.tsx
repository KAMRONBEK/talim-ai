'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Statistics', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/tenants', label: 'Tenants', icon: Building2 },
  { href: '/content', label: 'Content', icon: FileText },
  { href: '/generated', label: 'Generated media', icon: Sparkles },
  { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/usage', label: 'Usage & costs', icon: Wallet },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          T
        </span>
        <div>
          <p className="text-sm font-semibold">Talim Admin</p>
          <p className="text-xs text-muted-foreground">Platform control</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <p className="mb-2 truncate px-2 text-xs text-muted-foreground">{user?.email}</p>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
