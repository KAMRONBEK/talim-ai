import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Content, UserRole } from '@talim/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

function contentApiBase(role?: UserRole): string {
  return role === 'TENANT_OWNER' ? '/tenant/content' : '/content';
}

export function useContents() {
  const role = useAuthStore((s) => s.user?.role);
  const base = contentApiBase(role);
  return useQuery({
    queryKey: ['contents', base],
    queryFn: async () => {
      const { data } = await api.get<{ contents: Content[] }>(base);
      return data.contents;
    },
  });
}

export function useContent(id: string) {
  const role = useAuthStore((s) => s.user?.role);
  const base = contentApiBase(role);
  return useQuery({
    queryKey: ['content', id, base],
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
      queryClient.invalidateQueries({ queryKey: ['contents'] });
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

export function useDeleteContent(options?: { onDeleted?: (id: string) => void }) {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const base = contentApiBase(role);
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${base}/${id}`);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.removeQueries({ queryKey: ['content', id] });
      options?.onDeleted?.(id);
    },
  });
}
