'use client';

import React, { Suspense } from 'react';
import { AccountSwitcherView } from '@/components/auth/AccountSwitcherView';

export default function SwitchAccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountSwitcherView />
    </Suspense>
  );
}
