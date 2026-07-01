'use client';

import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { Badge, Button } from '@talim/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LearnerMessagesBell } from '@/components/learner/learner-messages-bell';
import { useBilling } from '@/hooks/useBilling';
import { planMessageKey } from '@/lib/plan';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const t = useTranslations('common');
  const { data: billing } = useBilling();
  const planKey = billing?.subscription
    ? planMessageKey(billing.subscription.effectivePlanCode)
    : null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-card/70 px-4 backdrop-blur-sm md:justify-end md:px-6">
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
        <LearnerMessagesBell />
        <LanguageSwitcher compact />
        <ThemeToggle />
        {planKey && (
          <Badge variant="secondary" className="font-normal">
            {t(planKey)}
          </Badge>
        )}
      </div>
    </header>
  );
}
