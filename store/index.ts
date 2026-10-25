import { PERSIST_STORE_NAME } from "@/constants/app/app.constant";
import rootReducer, { RootReducerState } from "./rootReducer";
import { configureStore, Middleware, Reducer } from "@reduxjs/toolkit";
import { persistStore, persistReducer, PersistConfig, PersistorOptions } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { Store } from "redux";
import { smartCacheMiddleware, dynamicInitMiddleware } from "@/middlewares";

interface ExtendedStore extends Store<RootReducerState> {
  asyncReducers: Record<string, Reducer>;
}

const middlewares: Middleware[] = [smartCacheMiddleware, dynamicInitMiddleware];

const persistConfig: PersistConfig<RootReducerState> = {
  key: PERSIST_STORE_NAME,
  keyPrefix: "",
  storage,
  whitelist: ["auth", "settings", "categories", "brands", "filter/state", "cartCollapse"],
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
