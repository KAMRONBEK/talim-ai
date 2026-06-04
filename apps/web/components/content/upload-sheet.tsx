'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@talim/ui';
import { UploadCard } from '@/components/content/UploadCard';

interface UploadSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function UploadSheet({ open, onOpenChange, trigger }: UploadSheetProps) {
  const sheet = (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger>{trigger as React.ReactElement}</SheetTrigger>}
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

  return sheet;
}
