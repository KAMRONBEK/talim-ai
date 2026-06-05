'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@talim/ui';
import { useDeleteContent } from '@/hooks/useContent';

interface DeleteContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: { id: string; title: string } | null;
  onDeleted?: (id: string) => void;
}

export function DeleteContentDialog({
  open,
  onOpenChange,
  content,
  onDeleted,
}: DeleteContentDialogProps) {
  const deleteContent = useDeleteContent({
    onDeleted: (id) => {
      onOpenChange(false);
      onDeleted?.(id);
    },
  });

  const handleDelete = () => {
    if (!content) return;
    deleteContent.mutate(content.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Materialni o&apos;chirish</DialogTitle>
          <DialogDescription>
            {content ? (
              <>
                <span className="font-medium text-foreground">&ldquo;{content.title}&rdquo;</span>{' '}
                butunlay o&apos;chiriladi. Boblar, chat, test va podkast ma&apos;lumotlari ham yo&apos;qoladi.
                Bu amalni qaytarib bo&apos;lmaydi.
              </>
            ) : (
              'Material butunlay o&apos;chiriladi. Bu amalni qaytarib bo&apos;lmaydi.'
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            disabled={deleteContent.isPending}
            onClick={() => onOpenChange(false)}
          >
            Bekor qilish
          </Button>
          <Button
            variant="destructive"
            type="button"
            disabled={deleteContent.isPending || !content}
            onClick={handleDelete}
          >
            {deleteContent.isPending ? 'O\'chirilmoqda...' : 'O\'chirish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
