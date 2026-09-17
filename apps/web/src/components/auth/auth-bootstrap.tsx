"use client";

import { useEffect } from "react";
import { useRefreshSessionQuery } from "@/store/api/auth-api";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/auth-slice";

/**
 * Hydrates the auth slice from the httpOnly refresh cookie once per page
 * load. The access token has to live in the slice, not just the query
 * cache, because base-api.ts's prepareHeaders needs synchronous access to
 * it outside any component — this effect is what keeps that copy in sync
 * with the one query that produces it, not a second source of truth for it.
 * A failed/absent cookie just leaves the slice at its logged-out default.
 */
export function AuthBootstrap() {
  const { data, isSuccess } = useRefreshSessionQuery();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isSuccess && data) dispatch(setCredentials(data));
  }, [isSuccess, data, dispatch]);

  return null;
}
