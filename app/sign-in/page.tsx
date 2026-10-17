'use client';

import React, { Suspense } from 'react';
import { LoginView } from '@/components/auth/LoginView';

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
