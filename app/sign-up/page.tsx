'use client';

import React, { Suspense } from 'react';
import { SignUpView } from '@/components/auth/SignUpView';

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpView />
    </Suspense>
  );
}
