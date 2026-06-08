'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@talim/ui';
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

  const assignedIds = new Set(assignments?.map((a) => a.learnerId) ?? []);
  const activeStudents = students?.filter((s) => s.active) ?? [];

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
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold">{t('assign.title')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t('assign.desc')}</p>
      <div className="mt-4 space-y-2">
        {activeStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('assign.noStudents')}</p>
        ) : (
          activeStudents.map((student) => (
            <label key={student.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(student.id) || assignedIds.has(student.id)}
                disabled={assignedIds.has(student.id)}
                onChange={() => toggle(student.id)}
              />
              <span>
                {student.name ?? student.email}
                {assignedIds.has(student.id) ? ` (${t('assign.assigned')})` : ''}
              </span>
              {assignedIds.has(student.id) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => unassign.mutate({ contentId, learnerId: student.id })}
                >
                  {t('assign.remove')}
                </Button>
              )}
            </label>
          ))
        )}
      </div>
      {selected.length > 0 && (
        <Button className="mt-4" onClick={handleAssign} disabled={assign.isPending}>
          {t('assign.submit')}
        </Button>
      )}
    </div>
  );
}
