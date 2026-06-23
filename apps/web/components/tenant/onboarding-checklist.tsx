'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Circle } from 'lucide-react';
import type { Content, TenantStudent } from '@talim/types';

export function OnboardingChecklist({
  contents,
  students,
  hasAssessments = false,
}: {
  contents: Content[] | undefined;
  students: TenantStudent[] | undefined;
  hasAssessments?: boolean;
}) {
  const t = useTranslations('tenant.onboarding');

  const hasMaterial = (contents?.length ?? 0) > 0;
  const hasStudent = (students?.length ?? 0) > 0;
  const hasAssigned = (students ?? []).some((s) => s.assignedCount > 0);
  const steps = [
    { done: true, label: t('password'), href: '/tenant/settings#account' },
    { done: hasMaterial, label: t('material'), href: '/tenant/materials' },
    { done: hasStudent, label: t('student'), href: '/tenant/students' },
    { done: hasAssigned, label: t('assign'), href: '/tenant/materials' },
    { done: hasAssessments, label: t('assessment'), href: '/tenant/assessments' },
  ];

  if (steps.every((step) => step.done)) return null;

  const doneCount = steps.filter((step) => step.done).length;

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">{t('title')}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('desc')}</p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tabular-nums text-primary">
          {doneCount}/{steps.length}
        </span>
      </div>
      <div className="grid gap-2">
        {steps.map((step) => (
          <Link
            key={step.label}
            href={step.href}
            className={
              step.done
                ? 'flex items-center gap-3 rounded-xl border border-border/70 px-3.5 py-2.5 text-sm transition-colors hover:bg-secondary/60'
                : 'flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm transition-colors hover:bg-primary/10'
            }
          >
            {step.done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-primary" />
            )}
            <span
              className={
                step.done ? 'text-muted-foreground line-through' : 'font-medium text-foreground'
              }
            >
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
