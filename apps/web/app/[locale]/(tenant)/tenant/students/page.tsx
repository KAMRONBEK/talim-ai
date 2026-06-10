'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@talim/ui';
import {
  useCreateTenantStudent,
  usePatchTenantStudent,
  useResetTenantStudentPassword,
  useTenantStudents,
} from '@/hooks/useTenant';

export default function TenantStudentsPage() {
  const t = useTranslations('tenant');
  const { data: students, isLoading } = useTenantStudents();
  const createStudent = useCreateTenantStudent();
  const patchStudent = usePatchTenantStudent();
  const resetPassword = useResetTenantStudentPassword();
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'reset'>('add');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredStudents = (students ?? []).filter((student) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return `${student.name ?? ''} ${student.email}`.toLowerCase().includes(q);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createStudent.mutateAsync({ email, name: name || undefined });
    setTempPassword(result.temporaryPassword);
    setEmail('');
    setName('');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('students.title')}</h1>
          <p className="text-muted-foreground">{t('students.desc')}</p>
        </div>
        <Button
          onClick={() => {
            setDialogMode('add');
            setOpen(true);
            setTempPassword(null);
          }}
        >
          {t('students.add')}
        </Button>
      </div>
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search students..."
        className="max-w-sm"
      />

      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3">{t('students.name')}</th>
              <th className="px-4 py-3">{t('students.email')}</th>
              <th className="px-4 py-3">{t('students.assigned')}</th>
              <th className="px-4 py-3">{t('students.lastActive')}</th>
              <th className="px-4 py-3">{t('students.avgQuiz')}</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-muted-foreground">{t('loading')}</td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/tenant/students/${s.id}`} className="font-medium hover:underline">
                      {s.name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{s.assignedCount}</td>
                  <td className="px-4 py-3">
                    {s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.avgQuizScore != null ? `${Math.round(s.avgQuizScore)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        resetPassword.mutate(s.id, {
                          onSuccess: (data) => {
                            setDialogMode('reset');
                            setTempPassword(data.temporaryPassword);
                            setOpen(true);
                          },
                        })
                      }
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => patchStudent.mutate({ id: s.id, active: !s.active })}
                    >
                      {s.active ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {filteredStudents.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/tenant/students/${s.id}`} className="font-medium">
                  {s.name ?? s.email}
                </Link>
                <p className="text-sm text-muted-foreground">{s.email}</p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                {s.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">{t('students.assigned')}</p>
                <p className="font-semibold">{s.assignedCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('students.avgQuiz')}</p>
                <p className="font-semibold">{s.avgQuizScore != null ? `${Math.round(s.avgQuizScore)}%` : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('students.lastActive')}</p>
                <p className="font-semibold">{s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleDateString() : '—'}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  resetPassword.mutate(s.id, {
                    onSuccess: (data) => {
                      setDialogMode('reset');
                      setTempPassword(data.temporaryPassword);
                      setOpen(true);
                    },
                  })
                }
              >
                Reset
              </Button>
              <Button size="sm" variant="ghost" onClick={() => patchStudent.mutate({ id: s.id, active: !s.active })}>
                {s.active ? 'Deactivate' : 'Reactivate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? t('students.add') : t('students.resetPassword')}
            </DialogTitle>
          </DialogHeader>
          {tempPassword ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('students.tempPasswordHint')}</p>
              <p className="rounded-lg bg-muted p-3 font-mono text-sm">{tempPassword}</p>
              <Button type="button" variant="outline" onClick={() => navigator.clipboard?.writeText(tempPassword)}>
                Copy password
              </Button>
              <Button onClick={() => setOpen(false)}>{t('students.done')}</Button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('students.email')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t('students.name')}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button type="submit" disabled={createStudent.isPending}>{t('students.create')}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
