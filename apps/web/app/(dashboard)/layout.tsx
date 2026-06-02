'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@talim/ui';
import { AuthGuard } from '@/components/auth-guard';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen">
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="text-xl font-bold text-primary">
              Talim.ai
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/content" className="text-sm hover:text-primary">
                Content
              </Link>
              {user && <span className="text-sm text-muted-foreground">{user.email}</span>}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
