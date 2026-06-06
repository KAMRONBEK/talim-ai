'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  Button,
  Input,
} from '@talim/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { useFileUpload } from '@/hooks/useFileUpload';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

interface LearningTopbarProps {
  contentId: string;
  title: string;
  onMenuClick?: () => void;
}

export function LearningTopbar({ contentId, title, onMenuClick }: LearningTopbarProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { fileInput, openFilePicker, isPending } = useFileUpload();

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
      {fileInput}
      <div className="flex min-w-0 items-center gap-2 md:gap-4">
        {onMenuClick && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 touch-manipulation md:hidden"
            onClick={onMenuClick}
            aria-label={t('menu')}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">
            T
          </span>
          <span className="hidden sm:inline">Talim AI</span>
        </Link>
        <Input
          className="hidden h-9 w-48 border bg-background text-sm lg:block xl:w-80"
          placeholder={t('searchPlaceholder')}
          disabled
          aria-label={t('search')}
        />
        <Link
          href="/dashboard"
          className="hidden rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary sm:inline-flex"
        >
          ← {t('back')}
        </Link>
        <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline sm:max-w-[200px] lg:max-w-xs">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher compact />
        <ThemeToggle compact />
        <Button
          size="sm"
          variant="outline"
          type="button"
          className="hidden touch-manipulation sm:inline-flex"
          disabled={isPending}
          onClick={openFilePicker}
        >
          {isPending ? t('uploading') : `+ ${t('upload')}`}
        </Button>
        <Link
          href={`/content/${contentId}/chat`}
          className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm font-medium hover:bg-accent"
        >
          💬 {t('aiTutor')}
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
          {t('logout')}
        </Button>
      </div>
    </header>
  );
}
