'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import store, { persistor } from '@/store';
import { setLanguage } from '@/store/settings/languageSlice';
import { showToast } from '@/store/slices/uiSlice';
import { restorePersistedStoreFromSubdomainNavigation } from '@/lib/i18n/location-subdomain';

const HydrationContext = createContext<boolean>(false);

export function useHydrated(): boolean {
  return useContext(HydrationContext);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const timer = setTimeout(() => {
      const { language, toastMessage } = restorePersistedStoreFromSubdomainNavigation();

      const completeHydration = () => {
        if (language) {
          store.dispatch(setLanguage(language));
        }
        if (toastMessage) {
          store.dispatch(showToast(toastMessage));
        }
        setIsHydrated(true);
      };

      if (persistor.getState().bootstrapped) {
        completeHydration();
      } else {
        unsubscribe = persistor.subscribe(() => {
          if (persistor.getState().bootstrapped) {
            if (unsubscribe) {
              unsubscribe();
              unsubscribe = undefined;
            }
            completeHydration();
          }
        });
        persistor.persist();
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <Provider store={store}>
      <HydrationContext.Provider value={isHydrated}>
        {children}
      </HydrationContext.Provider>
    </Provider>
  );
}
