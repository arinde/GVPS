import type { ClassArmOption } from "@/store/api/academic-api";
import { baseApi } from "@/store/api/base-api";

export type MyAccess = {
  school: { name: string };
  staff: { firstName: string | null; lastName: string | null; email: string };
  /** "school" sees every student; "arms" sees only allocated classes. */
  scope: "school" | "arms";
  allocatedArms: ClassArmOption[];
  canRegister: boolean;
  /** False for a teacher, who registers only into allocated classes. */
  registersAnywhere: boolean;
};

/**
 * What the signed-in person may see and do, so screens offer only what will
 * work. The API enforces the same rules on every request regardless.
 */
export const accessApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyAccess: builder.query<MyAccess, void>({
      query: () => ({ url: "/access/me" }),
      providesTags: ["Access"],
    }),
  }),
});

export const { useGetMyAccessQuery } = accessApi;
