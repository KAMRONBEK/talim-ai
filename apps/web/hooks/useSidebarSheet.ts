'use client';

import { useEffect, useState } from 'react';
import { usePathname } from '@/i18n/navigation';

export function useSidebarSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return { open, setOpen };
}
