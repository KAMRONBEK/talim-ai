import { getApiBaseUrl } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export async function fetchAuthenticatedBlob(path: string): Promise<string> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to fetch resource');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
