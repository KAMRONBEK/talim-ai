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

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('desc')}</p>
      </div>
      <div className="grid gap-2">
        {steps.map((step) => (
          <Link
            key={step.label}
            href={step.href}
            className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm hover:bg-secondary/60"
          >
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={step.done ? 'text-muted-foreground line-through' : ''}>{step.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
