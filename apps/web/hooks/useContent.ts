import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Content, UserRole } from '@talim/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useJobStreamStore } from '@/store/useJobStreamStore';
import {
  invalidateContentLists,
  prependContentToLists,
  removeContentFromLists,
  restoreContentLists,
  snapshotContentLists,
  listHasProcessing,
} from '@/lib/content-cache';

function contentApiBase(role?: UserRole): string {
  return role === 'TENANT_OWNER' ? '/tenant/content' : '/content';
}

export function useContents() {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role);
  const base = contentApiBase(role);
  const connected = useJobStreamStore((s) => s.connected);
  return useQuery({
    queryKey: ['contents', base],
    queryFn: async () => {
      const { data } = await api.get<{ contents: Content[] }>(base);
      return data.contents;
    },
    enabled: Boolean(token),
    // Ingest completion is pushed over SSE (useJobEvents); poll only as a slow safety net
    // while disconnected, so a list with a still-ingesting item still flips without SSE.
    refetchInterval: (query) =>
      listHasProcessing(query.state.data as Content[] | undefined) ? (connected ? 30_000 : 3000) : false,
  });
}

export function useContent(id: string) {
  const role = useAuthStore((s) => s.user?.role);
  const base = contentApiBase(role);
  const connected = useJobStreamStore((s) => s.connected);
  return useQuery({
    queryKey: ['content', id, base],
    queryFn: async () => {
      const { data } = await api.get<{ content: Content }>(`${base}/${id}`);
      return data.content;
    },
    enabled: !!id,
    // SSE-primary (useJobEvents pushes content.status); slow poll only as a safety net.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status !== 'PENDING' && status !== 'PROCESSING') return false;
      return connected ? 30_000 : 3000;
    },
  });
}

export function useRetryContent() {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const base = contentApiBase(role);
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ content: Content }>(`${base}/${id}/retry`);
      return data.content;
    },
    onSuccess: (_data, id) => {
      invalidateContentLists(queryClient);
      queryClient.invalidateQueries({ queryKey: ['content', id] });
    },
  });
}

export function useUploadContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<{ content: Content }>('/content/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.content;
    },
    onSuccess: (content) => {
      prependContentToLists(queryClient, content);
      invalidateContentLists(queryClient);
    },
  });
}

export function useCreateYoutubeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ url, title }: { url: string; title?: string }) => {
      const { data } = await api.post<{ content: Content }>('/content/youtube', { url, title });
      return data.content;
    },
    onSuccess: (content) => {
      prependContentToLists(queryClient, content);
      invalidateContentLists(queryClient);
    },
  });
}

export function useDeleteContent(options?: { onDeleted?: (id: string) => void }) {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const base = contentApiBase(role);
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${base}/${id}`);
    },
    // Remove the card immediately (across both list keys), roll back on failure.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['contents'] });
      await queryClient.cancelQueries({ queryKey: ['tenant', 'contents'] });
      const snapshot = snapshotContentLists(queryClient);
      removeContentFromLists(queryClient, id);
      return { snapshot };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot) restoreContentLists(queryClient, ctx.snapshot);
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ['content', id] });
      options?.onDeleted?.(id);
    },
    onSettled: () => invalidateContentLists(queryClient),
  });
}
