'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { SmoothScrolling } from './SmoothScrolling';

export function SiteChrome() {
  if (usePathname()?.startsWith('/studio')) return null;
  return <><SmoothScrolling /><Navbar /></>;
}
