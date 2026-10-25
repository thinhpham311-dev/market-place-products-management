import { combineReducers, Reducer, UnknownAction } from "@reduxjs/toolkit";
import auth from "./auth";
import settings from "./settings";
import products from "./slices/productsSlice";
import categories from "./slices/categoriesSlice";
import brands from "./slices/brandsSlice";
import ui from "./slices/uiSlice";

const staticReducers = {
  auth,
  settings,
  products,
  categories,
  brands,
  ui,
};

const combinedStaticReducer = combineReducers(staticReducers);
export type RootReducerState = ReturnType<typeof combinedStaticReducer>;

const rootReducer =
  (asyncReducers?: Record<string, Reducer>) =>
  (state: RootReducerState | undefined, action: UnknownAction) => {
    const combinedReducer = combineReducers({
      ...staticReducers,
      ...asyncReducers,
    });
    return combinedReducer(state as never, action);
  };

export default rootReducer;
