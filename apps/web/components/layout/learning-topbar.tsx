'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  Button,
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { UploadCard } from '@/components/content/UploadCard';

interface LearningTopbarProps {
  contentId: string;
  title: string;
}

export function LearningTopbar({ contentId, title }: LearningTopbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [uploadOpen, setUploadOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:px-5">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">
            T
          </span>
          <span className="hidden sm:inline">Talim AI</span>
        </Link>
        <Input
          className="hidden h-9 w-48 border bg-background text-sm lg:block xl:w-80"
          placeholder="Materiallaringizni qidiring..."
          disabled
          aria-label="Qidiruv"
        />
        <Link
          href="/dashboard"
          className="hidden rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary sm:inline-flex"
        >
          ← Orqaga
        </Link>
        <span className="hidden truncate text-sm font-medium md:inline max-w-[200px] lg:max-w-xs">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          type="button"
          className="hidden touch-manipulation sm:inline-flex"
          onClick={() => setUploadOpen(true)}
        >
          + Yuklash
        </Button>
        <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Material yuklash</SheetTitle>
            </SheetHeader>
            <div className="p-6 pt-0">
              <UploadCard compact onSuccess={() => setUploadOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <Link
          href={`/content/${contentId}/chat`}
          className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm font-medium hover:bg-accent"
        >
          💬 AI O&apos;qituvchi
        </Link>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="avatar-gradient text-xs">{initials}</AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => {
            logout();
            router.push('/login');
          }}
        >
          Chiqish
        </Button>
      </div>
    </header>
  );
}
