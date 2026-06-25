import type { QueryClient } from '@tanstack/react-query';
import type { Content } from '@talim/types';

/**
 * Content lists live under two query-key families that hold the same data:
 * `['contents', base]` (useContents) and `['tenant','contents']` (useTenantContents).
 * Mutations must keep BOTH in sync, otherwise e.g. deleting on the materials page
 * (['tenant','contents']) while only `['contents']` is invalidated leaves a ghost
 * card until a manual refresh. These helpers operate on every content list at once.
 */
const LIST_KEYS = [['contents'], ['tenant', 'contents']] as const;

export function invalidateContentLists(qc: QueryClient): void {
  for (const queryKey of LIST_KEYS) qc.invalidateQueries({ queryKey: [...queryKey] });
}

/** Optimistically drop a content id from every cached list (snappy delete). */
export function removeContentFromLists(qc: QueryClient, id: string): void {
  for (const queryKey of LIST_KEYS) {
    qc.setQueriesData<Content[]>({ queryKey: [...queryKey] }, (old) =>
      old ? old.filter((c) => c.id !== id) : old,
    );
  }
}

/** Optimistically prepend a freshly-created item so "add" feels instant. */
export function prependContentToLists(qc: QueryClient, content: Content): void {
  for (const queryKey of LIST_KEYS) {
    qc.setQueriesData<Content[]>({ queryKey: [...queryKey] }, (old) => {
      if (!old) return old;
      if (old.some((c) => c.id === content.id)) return old;
      return [content, ...old];
    });
  }
}

type ListSnapshot = ReturnType<QueryClient['getQueriesData']>;

export function snapshotContentLists(qc: QueryClient): ListSnapshot {
  return LIST_KEYS.flatMap((queryKey) => qc.getQueriesData<Content[]>({ queryKey: [...queryKey] }));
}

export function restoreContentLists(qc: QueryClient, snapshot: ListSnapshot): void {
  for (const [key, data] of snapshot) qc.setQueryData(key, data);
}

/** Poll a content list while any item is still ingesting, then stop. */
export function listHasProcessing(contents?: Content[]): boolean {
  return Boolean(contents?.some((c) => c.status === 'PENDING' || c.status === 'PROCESSING'));
}
