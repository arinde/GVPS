import { baseApi } from "@/store/api/base-api";

export type ServiceStatus = "UP" | "DOWN";

export type SystemHealthStatus = {
  checkedAt: string;
  database: { status: ServiceStatus; latencyMs: number };
  email: { status: ServiceStatus; configured: boolean };
  server: {
    status: ServiceStatus;
    uptimeSeconds: number;
    nodeVersion: string;
    environment: string;
    memoryUsedMb: number;
  };
};

export type UptimePoint = { date: string; uptimePercent: number };
export type StatusShareSlice = { name: string; value: number };
export type LatencyBucket = { bucket: string; count: number };

export type SystemHealthHistory = {
  windowDays: number;
  uptimeByDay: { database: UptimePoint[]; email: UptimePoint[]; apiServer: UptimePoint[] };
  statusShare: { database: StatusShareSlice[]; email: StatusShareSlice[]; apiServer: StatusShareSlice[] };
  latencyHistogram: LatencyBucket[];
};

/** FEATURES.md §11 — superadmin-only infrastructure status, separate from Analytics' school data. */
export const systemHealthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSystemHealthStatus: builder.query<SystemHealthStatus, void>({
      query: () => ({ url: "/system-health/status" }),
      providesTags: ["Dashboard"],
    }),
    getSystemHealthHistory: builder.query<SystemHealthHistory, { days: number }>({
      query: ({ days }) => ({ url: "/system-health/history", params: { days } }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetSystemHealthStatusQuery, useGetSystemHealthHistoryQuery } = systemHealthApi;
