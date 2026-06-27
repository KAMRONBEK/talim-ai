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

  const assignedIds = new Set(assignments?.map((a) => a.learnerId) ?? []);
  const activeStudents = (students?.filter((s) => s.active) ?? []).filter((student) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return `${student.name ?? ''} ${student.email}`.toLowerCase().includes(q);
  });

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAssign = async () => {
    for (const learnerId of selected) {
      if (!assignedIds.has(learnerId)) {
        await assign.mutateAsync({ contentId, learnerId });
      }
    }
    setSelected([]);
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <h3 className="font-display text-lg font-semibold">{t('assign.title')}</h3>
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
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
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
                    ? 'flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/40 px-3 py-2.5 text-sm'
                    : 'flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 text-sm transition-colors hover:bg-secondary/60'
                }
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                  checked={selected.includes(student.id) || isAssigned}
                  disabled={isAssigned}
                  onChange={() => toggle(student.id)}
                />
                <span className="flex-1 font-medium">{student.name ?? student.email}</span>
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
      {selected.length > 0 && (
        <Button className="mt-4 w-full" onClick={handleAssign} disabled={assign.isPending}>
          {t('assign.submit')}
        </Button>
      )}
    </div>
  );
}
