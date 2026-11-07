import { PERSIST_STORE_NAME } from "@/constants/app/app.constant";
import rootReducer, { RootReducerState } from "./rootReducer";
import { configureStore, Middleware, Reducer } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  PersistConfig,
  PersistorOptions,
  createTransform,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { Store } from "redux";
import { smartCacheMiddleware, dynamicInitMiddleware } from "@/middlewares";

interface ExtendedStore extends Store<RootReducerState> {
  asyncReducers: Record<string, Reducer>;
}

const middlewares: Middleware[] = [smartCacheMiddleware, dynamicInitMiddleware];

// Transform to strip token and refreshToken so they are NEVER saved to localStorage (HttpOnly cookies only)
const authSessionTransform = createTransform(
  (inboundState: unknown) => {
    if (!inboundState || typeof inboundState !== "object") return inboundState;
    const session = (inboundState as { session?: Record<string, unknown> }).session;
    if (session && typeof session === "object") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { token, refreshToken, ...safeSession } = session;
      return {
        ...(inboundState as Record<string, unknown>),
        session: safeSession,
      };
    }
    return inboundState;
  },
  (outboundState: unknown) => {
    if (!outboundState || typeof outboundState !== "object") return outboundState;
    const session = (outboundState as { session?: Record<string, unknown> }).session;
    if (session) {
      return {
        ...(outboundState as Record<string, unknown>),
        session: {
          ...session,
          token: "",
          refreshToken: "",
        },
      };
    }
    return outboundState;
  },
  { whitelist: ["auth"] },
);

// Clean up any legacy tokens previously saved in localStorage
if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem(PERSIST_STORE_NAME);
    if (raw && (raw.includes('"token"') || raw.includes('"refreshToken"'))) {
      const parsed = JSON.parse(raw);
      if (parsed?.auth) {
        const authData =
          typeof parsed.auth === "string" ? JSON.parse(parsed.auth) : parsed.auth;
        if (authData?.session) {
          delete authData.session.token;
          delete authData.session.refreshToken;
          parsed.auth =
            typeof parsed.auth === "string" ? JSON.stringify(authData) : authData;
          window.localStorage.setItem(PERSIST_STORE_NAME, JSON.stringify(parsed));
        }
      }
    }
  } catch {
    // Ignore storage parse errors
  }
}

const persistConfig: PersistConfig<RootReducerState> = {
  key: PERSIST_STORE_NAME,
  keyPrefix: "",
  storage,
  whitelist: ["auth", "settings", "categories", "brands", "filter/state", "cartCollapse"],
  transforms: [authSessionTransform],
};

const store = configureStore({
  reducer: persistReducer(persistConfig, rootReducer() as Reducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(middlewares),
  devTools: process.env.NEXT_PUBLIC_NODE_ENV === "development",
}) as unknown as ExtendedStore;

store.asyncReducers = {};

export const persistor = persistStore(store, {
  manualPersist: true,
} as unknown as PersistorOptions);

export const injectReducer = (key: string, reducer: Reducer): typeof store | false => {
  if (store.asyncReducers[key]) {
    return false;
  }
  store.asyncReducers[key] = reducer;
  store.replaceReducer(persistReducer(persistConfig, rootReducer(store.asyncReducers) as Reducer));
  persistor.persist();
  return store;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const removeReducer = (_key?: string) => {
  // Preserve injected reducers in memory across route navigations/unmounts
  // to avoid destroying cached state and causing global Redux store resets.
  return;
};

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
