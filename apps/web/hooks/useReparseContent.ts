import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { contentEndpoints } from '@/lib/api/endpoints';
import { fetchAuthenticatedBlob } from '@/lib/authenticatedBlob';
import { rasterizePdfToImages } from '@/lib/rasterize-pdf';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * "Re-read with OCR": rasterize the PDF in the browser (pdfjs), send page images
 * to the server for vision OCR, and re-ingest. Fixes scanned/image PDFs whose
 * embedded text layer is empty or junk so RAG (chat, slides, summaries) works.
 */
export function useReparseContent(contentId: string) {
  const isTenantOwner = useAuthStore((s) => s.user?.role === 'TENANT_OWNER');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const blobUrl = await fetchAuthenticatedBlob(contentEndpoints.file(contentId, isTenantOwner));
      try {
        const { images } = await rasterizePdfToImages(blobUrl);
        if (images.length === 0) throw new Error('No pages to read');
        const { data } = await api.post<{ chunks: number }>(
          contentEndpoints.reparse(contentId, isTenantOwner),
          { pages: images },
        );
        return data;
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.invalidateQueries({ queryKey: ['sections', contentId] });
      queryClient.invalidateQueries({ queryKey: ['section', contentId] });
      queryClient.invalidateQueries({ queryKey: ['slides', contentId] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}
