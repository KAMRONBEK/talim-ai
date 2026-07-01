'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoMark } from '@/components/logo';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tutor-requests', label: 'Requests' },
  { href: '/users', label: 'Users' },
  { href: '/tenants', label: 'Tenants' },
  { href: '/content', label: 'Content' },
  { href: '/generated', label: 'Generated' },
  { href: '/subscriptions', label: 'Subs' },
  { href: '/usage', label: 'Usage' },
  { href: '/audit', label: 'Audit' },
];

// Sticky top header (matches the Scholar admin design — a light paper bar, not a
// sidebar): logo + "Admin · Operator" pill on the left, horizontal nav + theme +
// sign-out on the right. Theme-aware (paper in light, ink surface in dark).
export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-4 gap-y-2 px-6 py-2.5">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <LogoMark className="h-7 w-7" />
          <span className="font-display text-[17px] font-semibold leading-none text-foreground">
            Talim&nbsp;AI
          </span>
          <span className="rounded-md bg-accent-secondary/15 px-1.5 py-1 font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-accent-secondary">
            Admin · Operator
          </span>
        </Link>

        <nav className="ml-auto flex flex-wrap items-center gap-1 font-label text-xs font-medium">
          {navItems.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                  active
                    ? 'bg-secondary font-semibold text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {label}
              </Link>
            );
          })}
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            title={user?.email ?? undefined}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
