import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Content } from '@talim/types';
import { api } from '@/lib/api';
import { contentEndpoints } from '@/lib/api/endpoints';
import { fetchAuthenticatedBlob } from '@/lib/authenticatedBlob';
import { rasterizePdfToImages } from '@/lib/rasterize-pdf';
import { invalidateContentLists } from '@/lib/content-cache';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * "Re-read with OCR": rasterize the PDF in the browser (pdfjs) and send page images
 * to the server, which stages them and hands the vision OCR + re-ingest to a
 * background job (202, content flips to PROCESSING). Fixes scanned/image PDFs whose
 * embedded text layer is empty or junk so RAG (chat, slides, summaries) works.
 *
 * The mutation resolves as soon as the job is queued: the refetched PROCESSING
 * status makes the content-status-gate processing screen take over, and the SSE
 * `content.status` READY/FAILED event (useJobEvents) finishes the loop —
 * including the sections/slides/summary invalidations.
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
        const { data } = await api.post<{ content: Content }>(
          contentEndpoints.reparse(contentId, isTenantOwner),
          { pages: images },
        );
        return data.content;
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    },
    onSuccess: () => {
      // Content is now PROCESSING — refetch the detail (both route families) and
      // the lists so the processing screen shows immediately everywhere.
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'content', contentId] });
      invalidateContentLists(queryClient);
    },
  });
}
