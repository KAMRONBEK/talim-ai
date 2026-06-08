'use client';

import { Card, CardContent } from '@talim/ui';

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tenants</h1>
        <p className="text-sm text-muted-foreground">Organizations and schools (Epic 3)</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No tenants yet. Tenant management will be available after Epic 3.
        </CardContent>
      </Card>
    </div>
  );
}
