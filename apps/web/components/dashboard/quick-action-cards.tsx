'use client';

import { useState } from 'react';
import { FileUp, Link2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@talim/ui';
import { FileUploadField, YoutubeLinkForm } from '@/components/content/UploadCard';
import { cn } from '@talim/ui';

export function QuickActionCards() {
  const [linkOpen, setLinkOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className={cn(
            'dashboard-card group flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left transition-all',
            'hover:border-primary/30 hover:shadow-md',
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileUp className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Yuklash</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Fayl, audio, video</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setLinkOpen(true)}
          className={cn(
            'dashboard-card group flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left transition-all',
            'hover:border-primary/30 hover:shadow-md',
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Havola</p>
            <p className="mt-0.5 text-sm text-muted-foreground">YouTube, veb-sayt</p>
          </div>
        </button>
      </div>

      <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Material yuklash</SheetTitle>
          </SheetHeader>
          <div className="p-6 pt-0">
            <FileUploadField onSuccess={() => setUploadOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Havola orqali qo&apos;shish</DialogTitle>
          </DialogHeader>
          <YoutubeLinkForm onSuccess={() => setLinkOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
