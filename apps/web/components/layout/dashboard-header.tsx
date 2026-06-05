'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@talim/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

export function DashboardHeader() {
  const t = useTranslations('common');

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b bg-background/80 px-6 backdrop-blur-sm">
      <LanguageSwitcher compact />
      <ThemeToggle />
      <Badge variant="secondary" className="font-normal">
        {t('freePlan')}
      </Badge>
    </header>
  );
}
