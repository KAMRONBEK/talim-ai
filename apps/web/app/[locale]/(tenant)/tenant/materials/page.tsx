'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileUp, Link2 } from 'lucide-react';
import {
  Button,
  buttonVariants,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from '@talim/ui';
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t('nav.materials')}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{t('allMaterials')}</h1>
          {contents && (
            <p className="mt-1 text-muted-foreground">{t('materialCount', { count: contents.length })}</p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Button type="button" variant="outline" onClick={() => setLinkOpen(true)}>
            <Link2 className="h-4 w-4" />
            {tDash('addViaLink')}
          </Button>
          <label
            className={cn(
              buttonVariants({ variant: 'gradient' }),
              'cursor-pointer',
              upload.isPending && 'pointer-events-none opacity-60',
            )}
          >
            <input
              type="file"
              accept={FILE_UPLOAD_ACCEPT}
              className="sr-only"
              onChange={handleFile}
              disabled={upload.isPending}
            />
            <FileUp className="h-4 w-4" />
            {upload.isPending ? tCommon('uploading') : tCommon('upload')}
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={tDash('searchMaterials')}
        className="max-w-sm"
      />

      {isLoading ? (
        <p className="text-muted-foreground">{tCommon('loading')}</p>
      ) : (
        <RecentContentGrid contents={filtered} />
      )}

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
