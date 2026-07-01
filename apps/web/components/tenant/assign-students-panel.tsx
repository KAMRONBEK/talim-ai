'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { Badge, Button, Input } from '@talim/ui';
import {
  useTenantStudents,
  useAssignContent,
  useContentAssignments,
  useUnassignContent,
} from '@/hooks/useTenant';

export function AssignStudentsPanel({ contentId }: { contentId: string }) {
  const t = useTranslations('tenant');
  const { data: students } = useTenantStudents();
  const { data: assignments } = useContentAssignments(contentId);
  const assign = useAssignContent();
  const unassign = useUnassignContent();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

  const assignedIds = new Set(assignments?.map((a) => a.learnerId) ?? []);
  const activePool = students?.filter((s) => s.active) ?? [];
  const activeStudents = activePool.filter((student) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return `${student.name ?? ''} ${student.email}`.toLowerCase().includes(q);
  });
  // Count against the assignable (active) pool, independent of the search box, so the header
  // stays stable while filtering. Both figures come from data the panel already loads.
  const totalCount = activePool.length;
  const assignedCount = activePool.filter((s) => assignedIds.has(s.id)).length;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAssign = async () => {
    setAssignError(null);
    // Assign each learner independently: one failure (e.g. a learner deactivated since the panel
    // loaded) must not silently abort the loop and skip the rest. Failed ids stay selected so the
    // owner can retry just those.
    const failed: string[] = [];
    for (const learnerId of selected) {
      if (!assignedIds.has(learnerId)) {
        try {
          await assign.mutateAsync({ contentId, learnerId });
        } catch {
          failed.push(learnerId);
        }
      }
    }
    setSelected(failed);
    if (failed.length > 0) setAssignError(t('assign.partialError', { count: failed.length }));
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-foreground">{t('assign.title')}</h3>
        <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-primary">
          {t('assign.assignedCount', { assigned: assignedCount, total: totalCount })}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t('assign.desc')}</p>
      <div className="mt-4 flex gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('assignSearch')}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setSelected(activeStudents.filter((s) => !assignedIds.has(s.id)).map((s) => s.id))
          }
        >
          {t('assignSelectAll')}
        </Button>
      </div>
      <div className="mt-4 space-y-1.5">
        {activeStudents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
              <Users className="h-6 w-6" />
            </span>
            <p className="text-sm text-muted-foreground">{t('assign.noStudents')}</p>
          </div>
        ) : (
          activeStudents.map((student) => {
            const isAssigned = assignedIds.has(student.id);
            return (
              <label
                key={student.id}
                className={
                  isAssigned
                    ? 'flex items-center gap-3 rounded-xl border border-primary/30 bg-secondary px-3 py-2.5 text-sm'
                    : 'flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm transition-colors hover:border-primary/30 hover:bg-secondary/50'
                }
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                  checked={selected.includes(student.id) || isAssigned}
                  disabled={isAssigned}
                  onChange={() => toggle(student.id)}
                />
                <span className="flex-1 font-medium text-foreground">{student.name ?? student.email}</span>
                {isAssigned && (
                  <>
                    <Badge variant="success">{t('assign.assigned')}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => unassign.mutate({ contentId, learnerId: student.id })}
                    >
                      {t('assign.remove')}
                    </Button>
                  </>
                )}
              </label>
            );
          })
        )}
      </div>
      {assignError && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {assignError}
        </p>
      )}
      {selected.length > 0 && (
        <Button className="mt-4 w-full" onClick={handleAssign} disabled={assign.isPending}>
          {t('assign.submit')}
        </Button>
      )}
    </div>
  );
}
