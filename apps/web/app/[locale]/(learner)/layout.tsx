import { LearnerShell } from '@/contexts/learner-shell';

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return <LearnerShell>{children}</LearnerShell>;
}
