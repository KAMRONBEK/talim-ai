'use client';

import { Card, CardContent } from '@talim/ui';

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Billing and plans (Epic 1)</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No subscriptions yet. Stripe billing will be available after Epic 1.
        </CardContent>
      </Card>
    </div>
  );
}
