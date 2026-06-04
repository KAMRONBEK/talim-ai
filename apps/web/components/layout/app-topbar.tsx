'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Avatar,
  AvatarFallback,
  Input,
} from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { UploadSheet } from '@/components/content/upload-sheet';

interface AppTopbarProps {
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function AppTopbar({ showSearch = true, searchQuery = '', onSearchChange }: AppTopbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-40 flex h-[var(--topbar-height)] shrink-0 items-center border-b bg-card/90 px-4 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
              T
            </span>
            Talim AI
          </Link>
          {showSearch && onSearchChange && (
            <Input
              className="hidden h-9 w-64 md:block"
              placeholder="Materiallaringizni qidiring..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <UploadSheet
            trigger={<Button size="sm">+ Yuklash</Button>}
          />
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
          >
            Kutubxona
          </Link>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="avatar-gradient text-xs">{initials}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              router.push('/login');
            }}
          >
            Chiqish
          </Button>
        </div>
      </div>
    </header>
  );
}
