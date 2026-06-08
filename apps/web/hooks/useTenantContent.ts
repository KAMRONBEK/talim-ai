import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Content } from '@talim/types';
import { api } from '@/lib/api';

const base = '/tenant/content';

export function useTenantContents() {
  return useQuery({
    queryKey: ['tenant', 'contents'],
    queryFn: async () => {
      const { data } = await api.get<{ contents: Content[] }>(base);
      return data.contents;
    },
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', 'contents'] }),
  });
}

export function useCreateTenantYoutubeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ url, title }: { url: string; title?: string }) => {
      const { data } = await api.post<{ content: Content }>(`${base}/youtube`, { url, title });
      return data.content;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant', 'contents'] }),
  });
}

export function useDeleteTenantContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${base}/${id}`);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'contents'] });
      queryClient.removeQueries({ queryKey: ['tenant', 'content', id] });
    },
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
      queryClient.invalidateQueries({ queryKey: ['tenant', 'contents'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'content', id] });
    },
  });
}
