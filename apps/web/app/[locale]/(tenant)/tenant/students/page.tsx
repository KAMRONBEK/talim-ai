'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Users as UsersIcon } from 'lucide-react';
import {
  Badge,
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
import { useBilling } from '@/hooks/useBilling';
import { JoinCodeCard } from '@/components/tenant/join-code-card';

function apiError(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export default function TenantStudentsPage() {
  const t = useTranslations('tenant');
  const { data: students, isLoading } = useTenantStudents();
  const createStudent = useCreateTenantStudent();
  const patchStudent = usePatchTenantStudent();
  const resetPassword = useResetTenantStudentPassword();
  const { data: billing } = useBilling();
  const seats = (billing?.usage as { students?: { used: number; limit: number | null } } | undefined)
    ?.students;
  const atSeatCap = seats?.limit != null && seats.used >= seats.limit;
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'reset'>('add');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ username: string | null; password: string } | null>(
    null,
  );
  const [search, setSearch] = useState('');

  const filteredStudents = (students ?? []).filter((student) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return `${student.name ?? ''} ${student.email ?? ''} ${student.username ?? ''}`
      .toLowerCase()
      .includes(q);
  });

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setName('');
    setCreateError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!email.trim() && !username.trim()) {
      setCreateError(t('students.identifierRequired'));
      return;
    }
    try {
      const result = await createStudent.mutateAsync({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
      });
      setCredentials({
        username: result.student.username,
        password: result.temporaryPassword,
      });
      resetForm();
    } catch (err) {
      setCreateError(apiError(err, t('students.createError')));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t('nav.students')}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{t('students.title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('students.desc')}</p>
          {seats && (
            <p className="mt-2 inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium tabular-nums text-muted-foreground">
              {t('students.seatUsage', { used: seats.used, limit: seats.limit ?? '∞' })}
            </p>
          )}
        </div>
        <Button
          variant="gradient"
          disabled={atSeatCap}
          title={atSeatCap ? t('students.seatUsage', { used: seats!.used, limit: seats!.limit ?? '∞' }) : undefined}
          onClick={() => {
            setDialogMode('add');
            setOpen(true);
            setCredentials(null);
            resetForm();
          }}
        >
          {t('students.add')}
        </Button>
      </div>

      <JoinCodeCard />

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('assignSearch')}
        className="max-w-sm"
      />

      <div className="hidden overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-soft md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/70 bg-muted/40">
            <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">{t('students.name')}</th>
              <th className="px-4 py-3">{t('students.email')}</th>
              <th className="px-4 py-3">{t('students.assigned')}</th>
              <th className="px-4 py-3">{t('students.lastActive')}</th>
              <th className="px-4 py-3">{t('students.avgQuiz')}</th>
              <th className="px-4 py-3 text-right">{t('actionsCol')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-muted-foreground">
                  {t('loading')}
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UsersIcon className="h-6 w-6" />
                    </span>
                    <p className="text-sm text-muted-foreground">{t('students.desc')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <Link href={`/tenant/students/${s.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                      {s.name ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.email ?? (s.username ? `@${s.username}` : '—')}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{s.assignedCount}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums">
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
                            setCredentials({ username: data.student.username, password: data.temporaryPassword });
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
          <div key={s.id} className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/tenant/students/${s.id}`} className="font-medium hover:text-primary">
                  {s.name ?? s.email ?? s.username}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {s.email ?? (s.username ? `@${s.username}` : '')}
                </p>
              </div>
              <Badge variant={s.active ? 'success' : 'secondary'}>
                {s.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">{t('students.assigned')}</p>
                <p className="font-semibold">{s.assignedCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('students.avgQuiz')}</p>
                <p className="font-semibold">
                  {s.avgQuizScore != null ? `${Math.round(s.avgQuizScore)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('students.lastActive')}</p>
                <p className="font-semibold">
                  {s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleDateString() : '—'}
                </p>
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
                      setCredentials({ username: data.student.username, password: data.temporaryPassword });
                      setOpen(true);
                    },
                  })
                }
              >
                Reset
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => patchStudent.mutate({ id: s.id, active: !s.active })}
              >
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
          {credentials ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('students.credentialsHint')}</p>
              <div className="space-y-1 rounded-xl border border-border/70 bg-muted p-3 font-mono text-sm">
                {credentials.username && (
                  <p>
                    {t('students.username')}: <span className="font-semibold">{credentials.username}</span>
                  </p>
                )}
                <p>
                  {t('students.password')}: <span className="font-semibold">{credentials.password}</span>
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    credentials.username
                      ? `${credentials.username} / ${credentials.password}`
                      : credentials.password,
                  )
                }
              >
                {t('students.copy')}
              </Button>
              <Button onClick={() => setOpen(false)}>{t('students.done')}</Button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('students.name')}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('students.emailOptional')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">{t('students.usernameOptional')}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('students.passwordOptional')}</Label>
                <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {createError && <p className="text-sm text-destructive">{createError}</p>}
              <Button type="submit" disabled={createStudent.isPending}>
                {t('students.create')}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
