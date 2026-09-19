import { baseApi } from "@/store/api/base-api";

export type DashboardOverview = {
  session: { name: string } | null;
  students: {
    enrolled: number;
    bySection: { NURSERY: number; PRIMARY: number; JUNIOR: number; SENIOR: number };
    registeredThisWeek: number;
  };
  staff: { total: number; passwordNotSet: number };
  classes: { total: number; withoutTeacher: number };
  /** Every class this session: how many are enrolled against its capacity, if set. */
  progress: { id: string; label: string; enrolled: number; capacity: number | null }[];
  activity: { id: string; at: string; title: string; detail: string }[];
};

/**
 * The superadmin and principal overview. Tagged "Dashboard" so registering a
 * student, creating staff or allocating a class refreshes it without a reload.
 */
export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardOverview, void>({
      query: () => ({ url: "/dashboard" }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
