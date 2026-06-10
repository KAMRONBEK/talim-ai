'use client';

import { Link } from '@/i18n/navigation';
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
  const hasMaterial = (contents?.length ?? 0) > 0;
  const hasStudent = (students?.length ?? 0) > 0;
  const hasAssigned = (students ?? []).some((s) => s.assignedCount > 0);
  const steps = [
    { done: true, label: 'Use the password shared by admin, or change it in Settings', href: '/tenant/settings' },
    { done: hasMaterial, label: 'Upload your first learning material', href: '/tenant/materials' },
    { done: hasStudent, label: 'Add your first student', href: '/tenant/students' },
    { done: hasAssigned, label: 'Assign a material to students', href: '/tenant/materials' },
    { done: hasAssessments, label: 'Create a written assessment from AI questions', href: '/tenant/assessments' },
  ];

  if (steps.every((step) => step.done)) return null;

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="font-semibold">Tutor setup checklist</h2>
        <p className="text-sm text-muted-foreground">
          Start with materials, students, and assignments. You can come back anytime.
        </p>
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
