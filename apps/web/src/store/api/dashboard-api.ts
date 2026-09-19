import { baseApi } from "@/store/api/base-api";

export type DashboardOverview = {
  session: { name: string } | null;
  students: {
    enrolled: number;
    bySection: { NURSERY: number; PRIMARY: number; JUNIOR: number; SENIOR: number };
    registeredThisWeek: number;
  };
  staff: { total: number; passwordNotSet: number };
  enquiries: { new: number };
  classes: { total: number; withoutTeacher: number };
  /** Every class this session: how many are enrolled against its capacity, if set. */
  progress: { id: string; label: string; enrolled: number; capacity: number | null }[];
  activity: { id: string; at: string; title: string; detail: string }[];
};

/** Any staff member's own home page, limited to the classes they can see. */
export type MyDashboard = {
  session: { name: string } | null;
  /** "arms" for a teacher limited to their classes; "school" for school-wide roles. */
  scope: "school" | "arms";
  canRegister: boolean;
  students: { total: number; registeredThisWeek: number; withoutPhoto: number };
  classes: { id: string; label: string; enrolled: number; capacity: number | null; girls: number; boys: number }[];
  recent: { id: string; name: string; admissionNo: string; className: string | null; registeredAt: string }[];
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

    getMyDashboard: builder.query<MyDashboard, void>({
      query: () => ({ url: "/dashboard/me" }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardQuery, useGetMyDashboardQuery } = dashboardApi;
