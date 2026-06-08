export type PlanMessageKey = 'freePlan' | 'proPlan';

export function planMessageKey(planCode: string): PlanMessageKey | null {
  if (planCode === 'FREE') return 'freePlan';
  if (planCode === 'INDIVIDUAL_PRO') return 'proPlan';
  return null;
}
