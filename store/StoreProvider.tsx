'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import store, { persistor } from '@/store';

const HydrationContext = createContext<boolean>(false);

export function useHydrated(): boolean {
  return useContext(HydrationContext);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      persistor.persist();
      setIsHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Provider store={store}>
      <HydrationContext.Provider value={isHydrated}>
        {children}
      </HydrationContext.Provider>
    </Provider>
  );
}
