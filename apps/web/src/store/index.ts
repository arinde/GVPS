import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "@/store/api/base-api";
import { portalApi } from "@/store/api/portal-api";
import { authReducer } from "@/store/slices/auth-slice";
import { portalAuthReducer } from "@/store/slices/portal-auth-slice";

/**
 * Builds a fresh store.
 *
 * Called per request rather than at module scope (AGENTS.md §3): a module-scope
 * singleton is shared across requests during SSR, which leaks one user's data
 * into another's render.
 */
export function makeStore() {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      [portalApi.reducerPath]: portalApi.reducer,
      auth: authReducer,
      portalAuth: portalAuthReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware, portalApi.middleware),
  });

  // Enables refetchOnFocus / refetchOnReconnect for every endpoint that opts in.
  setupListeners(store.dispatch);

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
