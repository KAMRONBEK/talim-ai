'use client';

import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { Badge, Button } from '@talim/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const t = useTranslations('common');

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur-sm md:justify-end md:px-6">
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
      <div className="flex items-center gap-3">
        <LanguageSwitcher compact />
        <ThemeToggle />
        <Badge variant="secondary" className="font-normal">
          {t('freePlan')}
        </Badge>
      </div>
    </header>
  );
}
