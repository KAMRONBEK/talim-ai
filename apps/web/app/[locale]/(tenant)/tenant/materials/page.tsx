'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileUp, Link2 } from 'lucide-react';
import { Button, cn, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '@talim/ui';
import { RecentContentGrid } from '@/components/dashboard/recent-content-grid';
import { useTenantSearch } from '@/contexts/tenant-shell';
import { useTenantContents, useUploadTenantContent, useCreateTenantYoutubeContent } from '@/hooks/useTenantContent';
import { FILE_UPLOAD_ACCEPT } from '@/hooks/useFileUpload';

export default function TenantMaterialsPage() {
  const t = useTranslations('tenant');
  const tDash = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { search, setSearch } = useTenantSearch();
  const { data: contents, isLoading } = useTenantContents();
  const upload = useUploadTenantContent();
  const youtube = useCreateTenantYoutubeContent();
  const [linkOpen, setLinkOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!contents) return [];
    const q = search.toLowerCase().trim();
    if (!q) return contents;
    return contents.filter((c) => c.title.toLowerCase().includes(q));
  }, [contents, search]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      await upload.mutateAsync(file);
    } catch {
      setError(t('uploadFailed'));
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
      <div className="w-full max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t('nav.materials')}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{t('allMaterials')}</h1>
      </div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={tDash('learnAnything')}
        className="mx-auto h-12 w-full max-w-2xl rounded-full shadow-soft"
      />
      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <label
          className={cn(
            'group flex cursor-pointer flex-col items-start gap-3 rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-card',
            upload.isPending && 'pointer-events-none opacity-60',
          )}
        >
          <input type="file" accept={FILE_UPLOAD_ACCEPT} className="sr-only" onChange={handleFile} disabled={upload.isPending} />
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            <FileUp className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display font-semibold">{tDash('uploadTitle')}</p>
            <p className="text-sm text-muted-foreground">{tDash('uploadDesc')}</p>
          </div>
        </label>
        <button
          type="button"
          onClick={() => setLinkOpen(true)}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-border/70 bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-card"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-secondary/15 text-accent-secondary transition-colors group-hover:bg-accent-secondary/20">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display font-semibold">{tDash('linkTitle')}</p>
            <p className="text-sm text-muted-foreground">{tDash('linkDesc')}</p>
          </div>
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="w-full">
        <h2 className="mb-4 font-display text-lg font-semibold">{t('allMaterials')}</h2>
        {isLoading ? (
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        ) : (
          <RecentContentGrid contents={filtered} />
        )}
      </div>
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tDash('linkTitle')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!youtubeUrl.trim()) return;
              await youtube.mutateAsync({ url: youtubeUrl.trim() });
              setYoutubeUrl('');
              setLinkOpen(false);
            }}
          >
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
            />
            <Button type="submit" disabled={youtube.isPending}>
              {youtube.isPending ? tCommon('uploading') : tDash('linkTitle')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
