'use client';

import Link from 'next/link';
import { use } from 'react';
import { Card, CardContent, CardHeader } from '@talim/ui';
import { useAdminUser } from '@/hooks/useAdmin';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useAdminUser(id);

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Loading user…</p>;
  }

  const { user, contents } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/users" className="text-sm text-primary hover:underline">
          ← Back to users
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{user.email}</h1>
        <p className="text-sm text-muted-foreground">{user.name ?? 'No name'}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="font-semibold">{user.role}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Content items</p>
            <p className="font-semibold">{user.contentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Quizzes</p>
            <p className="font-semibold">{user.quizCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">API cost (30d)</p>
            <p className="font-semibold">${user.usageLast30Days.toFixed(4)}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Recent content</h2>
        </CardHeader>
        <CardContent>
          {contents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No content yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {contents.map((c) => (
                <li key={c.id} className="flex justify-between border-b pb-2 last:border-0">
                  <span>{c.title}</span>
                  <span className="text-muted-foreground">
                    {c.type} · {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
