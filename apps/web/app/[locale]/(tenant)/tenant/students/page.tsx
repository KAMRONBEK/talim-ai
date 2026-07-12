'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  BookPlus,
  Download,
  MessageSquare,
  Send,
  Upload,
  Users as UsersIcon,
  UserX,
  X,
} from 'lucide-react';
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
import type { StudentImportResponse } from '@talim/types';
import {
  useAssignContent,
  useCreateTenantStudent,
  useImportStudents,
  usePatchTenantStudent,
  useResetTenantStudentPassword,
  useSendTenantMessage,
  useTenantStudents,
} from '@/hooks/useTenant';
import { useTenantContents } from '@/hooks/useTenantContent';
import { useBilling } from '@/hooks/useBilling';
import { JoinCodeCard } from '@/components/tenant/join-code-card';
import { cn } from '@/lib/utils';

function apiError(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

function studentInitials(s: { name?: string | null; email?: string | null; username?: string | null }): string {
  const base = (s.name ?? s.email ?? s.username ?? '?').trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export default function TenantStudentsPage() {
  const t = useTranslations('tenant');
  const { data: students, isLoading } = useTenantStudents();
  const createStudent = useCreateTenantStudent();
  const patchStudent = usePatchTenantStudent();
  const resetPassword = useResetTenantStudentPassword();
  const assignMaterial = useAssignContent();
  const importStudents = useImportStudents();
  const sendMessage = useSendTenantMessage();
  const { data: materials } = useTenantContents();
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
  // Bulk-selection is purely local UI state; it never touches the roster query cache.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMaterialId, setAssignMaterialId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  // CSV import dialog state.
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<StudentImportResponse | null>(null);
  // Bulk-message compose dialog state.
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSent, setMessageSent] = useState(false);

  const textareaClass =
    'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  const filteredStudents = (students ?? []).filter((student) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return `${student.name ?? ''} ${student.email ?? ''} ${student.username ?? ''}`
      .toLowerCase()
      .includes(q);
  });

  const filteredIds = filteredStudents.map((s) => s.id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.includes(id));
  const selectedStudents = (students ?? []).filter((s) => selectedIds.includes(s.id));

  const toggleOne = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  // Deactivate: loop the existing per-student patch mutation over the selection and await all,
  // relying on its built-in ['tenant','students'] + billing invalidation.
  const handleBulkDeactivate = async () => {
    const targets = selectedStudents.filter((s) => s.active);
    if (targets.length === 0) {
      clearSelection();
      return;
    }
    setBulkBusy(true);
    await Promise.all(
      targets.map((s) => patchStudent.mutateAsync({ id: s.id, active: false }).catch(() => null)),
    );
    setBulkBusy(false);
    clearSelection();
  };

  // Export: pure client-side CSV of the selected rows — no backend.
  const handleExport = () => {
    const escapeCsv = (value: string) => {
      // Neutralize spreadsheet formula injection (CWE-1236): a cell starting with
      // =, +, -, @, TAB, or CR is executed as a formula by Excel/Sheets/LibreOffice.
      // Student names are user-controlled (self-enroll display name, owner create, CSV
      // import), so prefix a leading formula char with a single quote to force text.
      const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const header = [t('students.name'), t('students.email'), t('students.status')];
    const rows = selectedStudents.map((s) => [
      s.name ?? '',
      s.email ?? (s.username ? `@${s.username}` : ''),
      s.active ? t('students.active') : t('students.inactive'),
    ]);
    const csv = [header, ...rows].map((cols) => cols.map(escapeCsv).join(',')).join('\n');
    // Prepend a UTF-8 BOM so Excel renders non-ASCII names correctly.
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'students.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // Assign material: reuse the existing per-student assign mutation (POST /tenant/assignments) for
  // each selected active learner. No new endpoint; existing invalidation applies per call.
  const assignTargets = selectedStudents.filter((s) => s.active);
  const handleBulkAssign = async () => {
    if (!assignMaterialId) return;
    setAssignError(null);
    const failed: string[] = [];
    for (const s of assignTargets) {
      try {
        await assignMaterial.mutateAsync({ contentId: assignMaterialId, learnerId: s.id });
      } catch {
        failed.push(s.id);
      }
    }
    if (failed.length > 0) {
      setAssignError(t('assign.partialError', { count: failed.length }));
    } else {
      setAssignOpen(false);
      setAssignMaterialId(null);
      clearSelection();
    }
  };

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

  const openImport = () => {
    setCsvText('');
    setImportError(null);
    setImportResult(null);
    setImportOpen(true);
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setCsvText(await file.text());
      setImportError(null);
    } catch {
      setImportError(t('students.importFileError'));
    }
  };

  const handleImport = async () => {
    setImportError(null);
    setImportResult(null);
    if (!csvText.trim()) {
      setImportError(t('students.importEmpty'));
      return;
    }
    try {
      const result = await importStudents.mutateAsync({ csv: csvText });
      setImportResult(result);
    } catch (err) {
      setImportError(apiError(err, t('students.importError')));
    }
  };

  const openMessage = () => {
    setMessageBody('');
    setMessageError(null);
    setMessageSent(false);
    setMessageOpen(true);
  };

  const handleSendMessage = async () => {
    setMessageError(null);
    if (!messageBody.trim()) {
      setMessageError(t('students.messageEmpty'));
      return;
    }
    try {
      await sendMessage.mutateAsync({ studentIds: selectedIds, body: messageBody.trim() });
      setMessageSent(true);
      setMessageBody('');
    } catch (err) {
      setMessageError(apiError(err, t('students.messageError')));
    }
  };

  // Per-row import-result styling → token classes + a translated label.
  const importRowStyle = (
    result: StudentImportResponse['report'][number]['result'],
  ): { badge: string; label: string } => {
    switch (result) {
      case 'created':
        return { badge: 'bg-success/15 text-success', label: t('students.importCreated') };
      case 'reactivated':
        return { badge: 'bg-primary/15 text-primary', label: t('students.importReactivated') };
      case 'skipped_duplicate':
        return { badge: 'bg-muted text-muted-foreground', label: t('students.importSkipped') };
      case 'error_seat_limit':
        return {
          badge: 'bg-accent-secondary/15 text-accent-secondary',
          label: t('students.importSeatLimited'),
        };
      default:
        return { badge: 'bg-destructive/15 text-destructive', label: t('students.importFailed') };
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t('nav.students')}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{t('students.title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('students.desc')}</p>
          {seats && (
            <p className="mt-3 inline-flex items-center rounded-full border border-primary/20 bg-secondary px-3 py-1 font-label text-xs font-semibold uppercase tracking-wide tabular-nums text-primary">
              {t('students.seatUsage', { used: seats.used, limit: seats.limit ?? '∞' })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={atSeatCap}
            title={atSeatCap ? t('students.seatUsage', { used: seats!.used, limit: seats!.limit ?? '∞' }) : undefined}
            onClick={openImport}
          >
            <Upload className="h-4 w-4" />
            {t('students.import')}
          </Button>
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
      </div>

      <JoinCodeCard />

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('assignSearch')}
        className="max-w-sm"
      />

      {selectedIds.length > 0 && (
        <div
          role="region"
          aria-label={t('students.bulkActions')}
          className="flex flex-wrap items-center gap-1 rounded-2xl border border-primary/25 bg-secondary px-3 py-2 shadow-soft"
        >
          <span className="px-2 font-label text-sm font-bold tabular-nums text-primary">
            {t('students.selectedCount', { count: selectedIds.length })}
          </span>
          <span className="mx-1 h-4 w-px bg-primary/25" aria-hidden="true" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => {
              setAssignError(null);
              setAssignMaterialId(null);
              setAssignOpen(true);
            }}
          >
            <BookPlus className="h-4 w-4" />
            {t('students.bulkAssign')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-primary hover:bg-primary/10 hover:text-primary"
            onClick={openMessage}
          >
            <MessageSquare className="h-4 w-4" />
            {t('students.bulkMessage')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-primary hover:bg-primary/10 hover:text-primary"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            {t('students.bulkExport')}
          </Button>
          <span className="mx-1 h-4 w-px bg-primary/25" aria-hidden="true" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleBulkDeactivate}
            disabled={bulkBusy}
          >
            <UserX className="h-4 w-4" />
            {t('students.deactivate')}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="ml-auto text-muted-foreground hover:text-foreground"
            onClick={clearSelection}
            aria-label={t('students.clearSelection')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="hidden overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-soft md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/70 bg-muted/40">
            <tr className="font-label text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label={t('assignSelectAll')}
                  checked={allFilteredSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 cursor-pointer align-middle accent-[hsl(var(--primary))]"
                />
              </th>
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
                <td colSpan={7} className="px-4 py-6 text-muted-foreground">
                  {t('loading')}
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UsersIcon className="h-6 w-6" />
                    </span>
                    <p className="text-sm text-muted-foreground">{t('students.desc')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((s, i) => (
                <tr
                  key={s.id}
                  className={cn(
                    'border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40',
                    selectedIds.includes(s.id) && 'bg-secondary/50',
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={t('students.selectRow')}
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleOne(s.id)}
                      className="h-4 w-4 cursor-pointer align-middle accent-[hsl(var(--primary))]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-label text-xs font-bold',
                          i % 2 === 0
                            ? 'bg-gradient-brand text-primary-foreground'
                            : 'bg-secondary text-primary',
                        )}
                      >
                        {studentInitials(s)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Link href={`/tenant/students/${s.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                          {s.name ?? '—'}
                        </Link>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 font-label text-[0.62rem] font-semibold uppercase tracking-wide',
                            s.active ? 'bg-secondary text-primary' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {s.active ? t('students.active') : t('students.inactive')}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.email ?? (s.username ? `@${s.username}` : '—')}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{s.assignedCount}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.avgQuizScore != null ? (
                      <div className="flex items-center gap-2.5">
                        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <span
                            className={cn(
                              'block h-full rounded-full',
                              s.avgQuizScore < 50 ? 'bg-accent-secondary' : 'bg-primary',
                            )}
                            style={{ width: `${Math.max(0, Math.min(100, s.avgQuizScore))}%` }}
                          />
                        </span>
                        <span
                          className={cn(
                            'font-label text-xs font-bold tabular-nums',
                            s.avgQuizScore < 50 ? 'text-accent-secondary' : 'text-primary',
                          )}
                        >
                          {Math.round(s.avgQuizScore)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
                      {t('students.reset')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => patchStudent.mutate({ id: s.id, active: !s.active })}
                    >
                      {s.active ? t('students.deactivate') : t('students.reactivate')}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {filteredStudents.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'rounded-2xl border bg-card p-4 shadow-soft',
              selectedIds.includes(s.id) ? 'border-primary/40' : 'border-border/70',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  aria-label={t('students.selectRow')}
                  checked={selectedIds.includes(s.id)}
                  onChange={() => toggleOne(s.id)}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-[hsl(var(--primary))]"
                />
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-label text-xs font-bold',
                    i % 2 === 0 ? 'bg-gradient-brand text-primary-foreground' : 'bg-secondary text-primary',
                  )}
                >
                  {studentInitials(s)}
                </span>
                <div className="min-w-0">
                  <Link href={`/tenant/students/${s.id}`} className="font-medium hover:text-primary">
                    {s.name ?? s.email ?? s.username}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">
                    {s.email ?? (s.username ? `@${s.username}` : '')}
                  </p>
                </div>
              </div>
              <Badge variant={s.active ? 'success' : 'secondary'}>
                {s.active ? t('students.active') : t('students.inactive')}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="font-label text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">{t('students.assigned')}</p>
                <p className="mt-0.5 font-display text-lg font-semibold tabular-nums">{s.assignedCount}</p>
              </div>
              <div>
                <p className="font-label text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">{t('students.avgQuiz')}</p>
                <p className={cn('mt-0.5 font-display text-lg font-semibold tabular-nums', s.avgQuizScore != null && s.avgQuizScore < 50 ? 'text-accent-secondary' : s.avgQuizScore != null ? 'text-primary' : '')}>
                  {s.avgQuizScore != null ? `${Math.round(s.avgQuizScore)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="font-label text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">{t('students.lastActive')}</p>
                <p className="mt-0.5 font-medium tabular-nums">
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
                {t('students.reset')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => patchStudent.mutate({ id: s.id, active: !s.active })}
              >
                {s.active ? t('students.deactivate') : t('students.reactivate')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('students.assignDialogTitle', { count: assignTargets.length })}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('students.assignDialogDesc')}</p>
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {(materials ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                {t('students.noMaterials')}
              </p>
            ) : (
              (materials ?? []).map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                    assignMaterialId === m.id
                      ? 'border-primary/40 bg-secondary'
                      : 'border-border hover:border-primary/30 hover:bg-secondary/50',
                  )}
                >
                  <input
                    type="radio"
                    name="bulk-assign-material"
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                    checked={assignMaterialId === m.id}
                    onChange={() => setAssignMaterialId(m.id)}
                  />
                  <span className="flex-1 truncate font-medium text-foreground">{m.title}</span>
                </label>
              ))
            )}
          </div>
          {assignError && (
            <p className="text-sm text-destructive" role="alert">
              {assignError}
            </p>
          )}
          <Button
            onClick={handleBulkAssign}
            disabled={!assignMaterialId || assignMaterial.isPending || assignTargets.length === 0}
          >
            {t('students.assignConfirm', { count: assignTargets.length })}
          </Button>
        </DialogContent>
      </Dialog>

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

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('students.importTitle')}</DialogTitle>
          </DialogHeader>
          {importResult ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('students.importSummary', {
                  created: importResult.summary.created,
                  reactivated: importResult.summary.reactivated,
                  skipped: importResult.summary.skipped,
                  seatLimited: importResult.summary.seatLimited,
                  errors: importResult.summary.errors,
                })}
              </p>
              <div className="max-h-72 space-y-1.5 overflow-y-auto">
                {importResult.report.map((row) => {
                  const style = importRowStyle(row.result);
                  return (
                    <div
                      key={row.row}
                      className="rounded-xl border border-border/70 bg-card p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-medium text-foreground">
                          {t('students.importRowLabel', { row: row.row })} · {row.name || '—'}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 font-label text-[0.62rem] font-semibold uppercase tracking-wide',
                            style.badge,
                          )}
                        >
                          {style.label}
                        </span>
                      </div>
                      {row.message && (
                        <p className="mt-1 text-xs text-muted-foreground">{row.message}</p>
                      )}
                      {row.temporaryPassword && (
                        <div className="mt-2 rounded-lg border border-border/70 bg-muted p-2 font-mono text-xs">
                          {row.username && (
                            <p>
                              {t('students.username')}:{' '}
                              <span className="font-semibold">{row.username}</span>
                            </p>
                          )}
                          <p>
                            {t('students.password')}:{' '}
                            <span className="font-semibold">{row.temporaryPassword}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={openImport}>
                  {t('students.importAnother')}
                </Button>
                <Button type="button" onClick={() => setImportOpen(false)}>
                  {t('students.done')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t('students.importDesc')}</p>
              <div className="space-y-1.5">
                <Label htmlFor="import-file">{t('students.importFileLabel')}</Label>
                <input
                  id="import-file"
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={(e) => handleImportFile(e.target.files?.[0])}
                  className="block w-full cursor-pointer rounded-xl border border-border bg-background text-sm text-muted-foreground shadow-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-label file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="import-csv">{t('students.importPasteLabel')}</Label>
                <textarea
                  id="import-csv"
                  rows={7}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={t('students.importPlaceholder')}
                  className={cn(textareaClass, 'font-mono')}
                />
              </div>
              {importError && (
                <p className="text-sm text-destructive" role="alert">
                  {importError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                  {t('students.cancel')}
                </Button>
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={importStudents.isPending || !csvText.trim()}
                >
                  {importStudents.isPending ? t('students.importing') : t('students.importSubmit')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('students.messageTitle')}</DialogTitle>
          </DialogHeader>
          {messageSent ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t('students.messageSent')}</p>
              <div className="flex justify-end">
                <Button type="button" onClick={() => setMessageOpen(false)}>
                  {t('students.done')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('students.messageDesc', { count: selectedIds.length })}
              </p>
              <textarea
                rows={5}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder={t('students.messagePlaceholder')}
                className={textareaClass}
                maxLength={5000}
              />
              {messageError && (
                <p className="text-sm text-destructive" role="alert">
                  {messageError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setMessageOpen(false)}>
                  {t('students.cancel')}
                </Button>
                <Button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={sendMessage.isPending || !messageBody.trim()}
                >
                  <Send className="h-4 w-4" />
                  {sendMessage.isPending ? t('students.messageSending') : t('students.messageSend')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
