import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "@/store/api/base-api";
import { authReducer } from "@/store/slices/auth-slice";

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
      auth: authReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });

  // Enables refetchOnFocus / refetchOnReconnect for every endpoint that opts in.
  setupListeners(store.dispatch);

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
