'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@talim/ui';
import { UploadCard } from '@/components/content/UploadCard';

interface UploadSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UploadSheet({ open, onOpenChange }: UploadSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Material yuklash</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <UploadCard compact onSuccess={() => onOpenChange?.(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
