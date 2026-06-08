export type PlanMessageKey = 'freePlan' | 'proPlan' | 'tenantStarterPlan' | 'tenantGrowthPlan';

export function planMessageKey(planCode: string): PlanMessageKey | null {
  if (planCode === 'FREE') return 'freePlan';
  if (planCode === 'INDIVIDUAL_PRO') return 'proPlan';
  if (planCode === 'TENANT_STARTER') return 'tenantStarterPlan';
  if (planCode === 'TENANT_GROWTH') return 'tenantGrowthPlan';
  return null;
}
