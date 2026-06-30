'use client';

import { useTranslations } from 'next-intl';
import { ArrowUp, Search } from 'lucide-react';
import { Button, Input } from '@talim/ui';
import { useDashboardSearch } from '@/contexts/dashboard-search';

export function DashboardSearchBar() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { search, setSearch } = useDashboardSearch();

  return (
    <form
      className="relative mx-auto w-full max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById('dashboard-recents')?.scrollIntoView({ behavior: 'smooth' });
      }}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('learnAnything')}
        className="h-12 rounded-full border-border bg-card pl-11 pr-14 text-base shadow-soft"
      />
      <Button
        type="submit"
        size="icon"
        className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
        aria-label={tCommon('search')}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </form>
  );
}
