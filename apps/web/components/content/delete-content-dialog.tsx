'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('content');
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
          <DialogTitle>{t('deleteMaterialTitle')}</DialogTitle>
          <DialogDescription>
            {content
              ? t.rich('deleteMaterialDescription', {
                  title: content.title,
                  b: (chunks) => (
                    <span className="font-medium text-foreground">{chunks}</span>
                  ),
                })
              : t('deleteMaterialDescriptionGeneric')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            disabled={deleteContent.isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('deleteCancel')}
          </Button>
          <Button
            variant="destructive"
            type="button"
            disabled={deleteContent.isPending || !content}
            onClick={handleDelete}
          >
            {deleteContent.isPending ? t('deleting') : t('deleteConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
