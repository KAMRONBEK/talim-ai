'use client';

import { ArrowUp } from 'lucide-react';
import { Button, Input } from '@talim/ui';
import { useDashboardSearch } from '@/contexts/dashboard-search';

export function DashboardSearchBar() {
  const { search, setSearch } = useDashboardSearch();

  return (
    <form
      className="relative mx-auto w-full max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById('dashboard-recents')?.scrollIntoView({ behavior: 'smooth' });
      }}
    >
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Har qanday narsani o&apos;rganing"
        className="h-12 rounded-full border-border bg-card pl-5 pr-14 text-base shadow-sm"
      />
      <Button
        type="submit"
        size="icon"
        className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
        aria-label="Qidirish"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </form>
  );
}
