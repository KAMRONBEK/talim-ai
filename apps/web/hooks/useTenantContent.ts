import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Content } from '@talim/types';
import { api } from '@/lib/api';
import {
  invalidateContentLists,
  prependContentToLists,
  removeContentFromLists,
  restoreContentLists,
  snapshotContentLists,
  listHasProcessing,
} from '@/lib/content-cache';

const base = '/tenant/content';

export function useTenantContents() {
  return useQuery({
    queryKey: ['tenant', 'contents'],
    queryFn: async () => {
      const { data } = await api.get<{ contents: Content[] }>(base);
      return data.contents;
    },
    // Poll while a freshly-added material is still ingesting so the grid flips
    // from "processing" to ready on its own.
    refetchInterval: (query) => (listHasProcessing(query.state.data as Content[] | undefined) ? 3000 : false),
  });
}

export function useTenantContent(id: string) {
  return useQuery({
    queryKey: ['tenant', 'content', id],
    queryFn: async () => {
      const { data } = await api.get<{ content: Content }>(`${base}/${id}`);
      return data.content;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'PENDING' || status === 'PROCESSING') return 3000;
      return false;
    },
  });
}

export function useUploadTenantContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<{ content: Content }>(`${base}/upload`, formData, {
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

export function useCreateTenantYoutubeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ url, title }: { url: string; title?: string }) => {
      const { data } = await api.post<{ content: Content }>(`${base}/youtube`, { url, title });
      return data.content;
    },
    onSuccess: (content) => {
      prependContentToLists(queryClient, content);
      invalidateContentLists(queryClient);
    },
  });
}

export function useDeleteTenantContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${base}/${id}`);
    },
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
      queryClient.removeQueries({ queryKey: ['tenant', 'content', id] });
    },
    onSettled: () => invalidateContentLists(queryClient),
  });
}

export function useRetryTenantContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ content: Content }>(`${base}/${id}/retry`);
      return data.content;
    },
    onSuccess: (_data, id) => {
      invalidateContentLists(queryClient);
      queryClient.invalidateQueries({ queryKey: ['tenant', 'content', id] });
    },
  });
}
