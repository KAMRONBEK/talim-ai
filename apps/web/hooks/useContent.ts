import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Content } from '@talim/types';
import { api } from '@/lib/api';

export function useContents() {
  return useQuery({
    queryKey: ['contents'],
    queryFn: async () => {
      const { data } = await api.get<{ contents: Content[] }>('/content');
      return data.contents;
    },
  });
}

export function useContent(id: string) {
  return useQuery({
    queryKey: ['content', id],
    queryFn: async () => {
      const { data } = await api.get<{ content: Content }>(`/content/${id}`);
      return data.content;
    },
    enabled: !!id,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contents'] }),
  });
}

export function useCreateYoutubeContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ url, title }: { url: string; title?: string }) => {
      const { data } = await api.post<{ content: Content }>('/content/youtube', { url, title });
      return data.content;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contents'] }),
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/content/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contents'] }),
  });
}
