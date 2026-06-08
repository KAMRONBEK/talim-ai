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
import { useCreateTenantStudent, useTenantStudents } from '@/hooks/useTenant';

export default function TenantStudentsPage() {
  const t = useTranslations('tenant');
  const { data: students, isLoading } = useTenantStudents();
  const createStudent = useCreateTenantStudent();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createStudent.mutateAsync({ email, name: name || undefined });
    setTempPassword(result.temporaryPassword);
    setEmail('');
    setName('');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('students.title')}</h1>
          <p className="text-muted-foreground">{t('students.desc')}</p>
        </div>
        <Button onClick={() => { setOpen(true); setTempPassword(null); }}>{t('students.add')}</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3">{t('students.name')}</th>
              <th className="px-4 py-3">{t('students.email')}</th>
              <th className="px-4 py-3">{t('students.assigned')}</th>
              <th className="px-4 py-3">{t('students.lastActive')}</th>
              <th className="px-4 py-3">{t('students.avgQuiz')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted-foreground">{t('loading')}</td>
              </tr>
            ) : (
              students?.map((s) => (
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('students.add')}</DialogTitle>
          </DialogHeader>
          {tempPassword ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('students.tempPasswordHint')}</p>
              <p className="rounded-lg bg-muted p-3 font-mono text-sm">{tempPassword}</p>
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
