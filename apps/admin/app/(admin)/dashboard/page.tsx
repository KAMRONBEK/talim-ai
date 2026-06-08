'use client';

import { Card, CardContent, CardHeader } from '@talim/ui';
import { usePlatformStats } from '@/hooks/useAdmin';
import { BarChart3, FileText, Users, Wallet } from 'lucide-react';

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
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = usePlatformStats();

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Loading statistics…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform statistics</h1>
        <p className="text-sm text-muted-foreground">Overview of users, content, and API spend</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total users" value={data.totalUsers} icon={Users} sub={`+${data.signupsLast7Days} last 7 days`} />
        <StatCard title="Active users (30d)" value={data.activeUsersLast30Days} icon={BarChart3} />
        <StatCard title="Total content" value={data.totalContents} icon={FileText} sub={`${data.contentsByStatus.READY} ready`} />
        <StatCard title="Est. API spend" value={`$${data.estimatedApiSpendUsd.toFixed(4)}`} icon={Wallet} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold">Signups</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last 7 days</span>
              <span className="font-medium">{data.signupsLast7Days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last 30 days</span>
              <span className="font-medium">{data.signupsLast30Days}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold">Generations</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quizzes</span>
              <span className="font-medium">{data.totalQuizzes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Podcasts</span>
              <span className="font-medium">{data.totalPodcasts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slideshows</span>
              <span className="font-medium">{data.totalSlideshows}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Summaries</span>
              <span className="font-medium">{data.totalSummaries}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
