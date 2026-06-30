'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoMark } from '@/components/logo';

const navItems = [
  { href: '/dashboard', label: 'Statistics', icon: LayoutDashboard },
  { href: '/tutor-requests', label: 'Tutor requests', icon: UserPlus },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/tenants', label: 'Tenants', icon: Building2 },
  { href: '/content', label: 'Content', icon: FileText },
  { href: '/generated', label: 'Generated media', icon: Sparkles },
  { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/usage', label: 'Usage & costs', icon: Wallet },
  { href: '/audit', label: 'Audit log', icon: ScrollText },
];

// The admin console is operator chrome — a permanently-dark "ink" sidebar
// (theme-independent) beside the light/dark paper content area.
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
    <aside className="flex w-[var(--sidebar-width)] shrink-0 flex-col border-r border-white/10 bg-[#211b15] text-[#d8d0c4]">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
        <LogoMark className="h-8 w-8" />
        <div>
          <p className="font-display text-[15px] font-semibold leading-none text-[#f7f2e8]">
            Talim&nbsp;Admin
          </p>
          <p className="mt-1 font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a8076]">
            Platform control
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-primary font-semibold text-primary-foreground'
                  : 'text-[#b8b0a4] hover:bg-white/5 hover:text-[#f7f2e8]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="mb-2 truncate px-2 text-xs text-[#8a8076]">{user?.email}</p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 flex-1 items-center justify-start gap-2 rounded-xl border border-white/15 px-3 text-sm font-medium text-[#d8d0c4] transition-colors hover:bg-white/5 hover:text-[#f7f2e8]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
