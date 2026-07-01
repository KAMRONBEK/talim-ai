'use client';

import { Card, CardContent, CardHeader } from '@talim/ui';
import {
  usePlatformStats,
  useAdminAnalyticsSummary,
  useAdminAnalyticsMrr,
  useAdminAnalyticsUserGrowth,
  useAdminAnalyticsByRole,
  useAdminAnalyticsFunnel,
  useAdminAnalyticsContentByType,
  useAdminAnalyticsTopOrgs,
  useAdminAnalyticsSpendByModel,
} from '@/hooks/useAdmin';
import { Activity, Building2, FileText, ListChecks, Users, Wallet } from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// CSS-var-driven palette so charts track the Scholar tokens in light + dark.
const C = {
  primary: 'hsl(var(--primary))',
  accent: 'hsl(var(--accent-secondary))',
  info: 'hsl(var(--info))',
  warning: 'hsl(var(--warning))',
  success: 'hsl(var(--success))',
  destructive: 'hsl(var(--destructive))',
  grid: 'hsl(var(--border))',
  tick: 'hsl(var(--muted-foreground))',
} as const;

const PALETTE = [C.primary, C.accent, C.info, C.warning, C.success, C.destructive];

const tooltipStyle = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.75rem',
    color: 'hsl(var(--foreground))',
    fontSize: '0.8125rem',
  },
  labelStyle: { color: 'hsl(var(--muted-foreground))' },
  itemStyle: { color: 'hsl(var(--foreground))' },
  cursor: { fill: 'hsl(var(--muted) / 0.5)' },
} as const;

function usd(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
}) {
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader className="pb-2">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ChartState({ loading, empty }: { loading: boolean; empty: boolean }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      {loading ? 'Loading…' : empty ? 'No data yet' : null}
    </div>
  );
}

export default function AdminDashboardPage() {
  const platform = usePlatformStats();
  const summary = useAdminAnalyticsSummary();
  const mrr = useAdminAnalyticsMrr();
  const growth = useAdminAnalyticsUserGrowth();
  const byRole = useAdminAnalyticsByRole();
  const funnel = useAdminAnalyticsFunnel();
  const contentByType = useAdminAnalyticsContentByType();
  const topOrgs = useAdminAnalyticsTopOrgs();
  const spendByModel = useAdminAnalyticsSpendByModel();

  const s = summary.data;
  const roleData = byRole.data?.roles ?? [];
  const growthData = growth.data?.points ?? [];
  const typeData = contentByType.data?.types ?? [];
  const orgs = topOrgs.data?.orgs ?? [];
  const spendRows = spendByModel.data?.rows ?? [];
  const funnelData = funnel.data
    ? [
        { stage: 'Registered', value: funnel.data.registered },
        { stage: 'Activated', value: funnel.data.activated },
        { stage: 'Tutors', value: funnel.data.tutors },
        { stage: 'Paid', value: funnel.data.paid },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Admin
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Platform analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Users, orgs, content, funnel, and API spend across the platform
        </p>
      </div>

      {/* KPI cards — analytics summary */}
      {summary.isError ? (
        <p className="text-sm text-destructive">Couldn&apos;t load the analytics summary. Please try again.</p>
      ) : summary.isLoading || !s ? (
        <p className="text-muted-foreground">Loading summary…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard title="Total users" value={s.users.toLocaleString()} icon={Users} />
          <StatCard title="Active (30d)" value={s.active30d.toLocaleString()} icon={Activity} />
          <StatCard title="Organizations" value={s.orgs.toLocaleString()} icon={Building2} />
          <StatCard title="Content items" value={s.content.toLocaleString()} icon={FileText} />
          <StatCard title="Quizzes taken" value={s.quizzesTaken.toLocaleString()} icon={ListChecks} />
          <StatCard title="MRR" value={usd(s.mrrUsd)} icon={Wallet} />
        </div>
      )}

      {/* User growth + users by role */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="User growth" hint="Cumulative total (area) and new signups per month (line)">
          {growth.isLoading || growth.isError || growthData.length === 0 ? (
            <ChartState loading={growth.isLoading} empty={growthData.length === 0 || growth.isError} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={growthData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: C.tick, fontSize: 12 }} stroke={C.grid} />
                  <YAxis tick={{ fill: C.tick, fontSize: 12 }} stroke={C.grid} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="totalUsers"
                    name="Total users"
                    stroke={C.primary}
                    fill={C.primary}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    name="New users"
                    stroke={C.accent}
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Users by role">
          {byRole.isLoading || byRole.isError || roleData.length === 0 ? (
            <ChartState loading={byRole.isLoading} empty={roleData.length === 0 || byRole.isError} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis dataKey="role" tick={{ fill: C.tick, fontSize: 11 }} stroke={C.grid} />
                  <YAxis tick={{ fill: C.tick, fontSize: 12 }} stroke={C.grid} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" name="Users" radius={[6, 6, 0, 0]}>
                    {roleData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Funnel + content by type */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Activation funnel" hint="Registered → activated → tutors → paid">
          {funnel.isLoading || funnel.isError || funnelData.length === 0 ? (
            <ChartState loading={funnel.isLoading} empty={funnelData.length === 0 || funnel.isError} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={funnelData}
                  margin={{ top: 8, right: 16, left: 24, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fill: C.tick, fontSize: 12 }} stroke={C.grid} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tick={{ fill: C.tick, fontSize: 12 }}
                    stroke={C.grid}
                    width={80}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" name="Users" radius={[0, 6, 6, 0]}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Content by type">
          {contentByType.isLoading || contentByType.isError || typeData.length === 0 ? (
            <ChartState
              loading={contentByType.isLoading}
              empty={typeData.length === 0 || contentByType.isError}
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="hsl(var(--card))" />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* MRR breakdown + spend by model */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Monthly recurring revenue"
          hint={mrr.data ? `${usd(mrr.data.mrrUsd)} · ${mrr.data.activeSubscriptions} active subscriptions` : undefined}
        >
          {mrr.isLoading ? (
            <ChartState loading empty={false} />
          ) : mrr.isError ? (
            <p className="text-sm text-destructive">Couldn&apos;t load MRR.</p>
          ) : !mrr.data || mrr.data.byPlan.length === 0 ? (
            <ChartState loading={false} empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left font-label text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-3 font-semibold">Plan</th>
                    <th className="py-2 pr-3 text-right font-semibold">Active</th>
                    <th className="py-2 pr-3 text-right font-semibold">Price</th>
                    <th className="py-2 text-right font-semibold">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {mrr.data.byPlan.map((p) => (
                    <tr key={p.planCode} className="border-t border-border/60">
                      <td className="py-2 pr-3 font-medium">
                        {p.planName}
                        <span className="ml-2 text-xs text-muted-foreground">{p.planKind}</span>
                      </td>
                      <td className="py-2 pr-3 text-right">{p.activeSubscriptions}</td>
                      <td className="py-2 pr-3 text-right text-muted-foreground">{usd(p.priceMonthlyUsd)}</td>
                      <td className="py-2 text-right font-medium">{usd(p.mrrUsd)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border">
                    <td className="py-2 pr-3 font-semibold" colSpan={3}>
                      Total MRR
                    </td>
                    <td className="py-2 text-right font-semibold">{usd(mrr.data.mrrUsd)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Spend by model"
          hint={
            spendByModel.data
              ? `${usd(spendByModel.data.totalCostUsd)} total${spendByModel.data.approximated ? ' · some rows approximated' : ''}`
              : undefined
          }
        >
          {spendByModel.isLoading ? (
            <ChartState loading empty={false} />
          ) : spendByModel.isError ? (
            <p className="text-sm text-destructive">Couldn&apos;t load spend by model.</p>
          ) : spendRows.length === 0 ? (
            <ChartState loading={false} empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left font-label text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-3 font-semibold">Model</th>
                    <th className="py-2 pr-3 text-right font-semibold">Events</th>
                    <th className="py-2 text-right font-semibold">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {spendRows.map((r) => (
                    <tr key={r.model} className="border-t border-border/60">
                      <td className="py-2 pr-3">
                        <span className="font-mono text-xs">{r.model}</span>
                        {r.approximated && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-warning-muted px-2 py-0.5 text-[10px] font-medium text-warning">
                            approx.
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right text-muted-foreground">
                        {r.eventCount.toLocaleString()}
                      </td>
                      <td className="py-2 text-right font-medium">{usd(r.costUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Top orgs */}
      <ChartCard title="Top organizations" hint="Ranked by API spend">
        {topOrgs.isLoading ? (
          <ChartState loading empty={false} />
        ) : topOrgs.isError ? (
          <p className="text-sm text-destructive">Couldn&apos;t load top organizations.</p>
        ) : orgs.length === 0 ? (
          <ChartState loading={false} empty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-label text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">#</th>
                  <th className="py-2 pr-3 font-semibold">Organization</th>
                  <th className="py-2 pr-3 font-semibold">Plan</th>
                  <th className="py-2 pr-3 text-right font-semibold">Students</th>
                  <th className="py-2 pr-3 text-right font-semibold">Content</th>
                  <th className="py-2 text-right font-semibold">API spend</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o, i) => (
                  <tr key={o.tenantId} className="border-t border-border/60">
                    <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <span className="font-medium">{o.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{o.slug}</span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{o.planCode ?? '—'}</td>
                    <td className="py-2 pr-3 text-right">{o.studentCount}</td>
                    <td className="py-2 pr-3 text-right">{o.contentCount}</td>
                    <td className="py-2 text-right font-medium">{usd(o.usageCostUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

      {/* Legacy platform breakdown (kept — not covered by the analytics summary) */}
      {platform.data && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader className="pb-2">
              <h2 className="font-display text-base font-semibold">Signups</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last 7 days</span>
                <span className="font-medium">{platform.data.signupsLast7Days}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last 30 days</span>
                <span className="font-medium">{platform.data.signupsLast30Days}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-soft">
            <CardHeader className="pb-2">
              <h2 className="font-display text-base font-semibold">Generations</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quizzes</span>
                <span className="font-medium">{platform.data.totalQuizzes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Podcasts</span>
                <span className="font-medium">{platform.data.totalPodcasts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slideshows</span>
                <span className="font-medium">{platform.data.totalSlideshows}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Summaries</span>
                <span className="font-medium">{platform.data.totalSummaries}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
