import { baseApi } from "@/store/api/base-api";

export type ClassArmOption = {
  id: string;
  name: string;
  capacity: number | null;
  stream: "SCIENCE" | "ARTS" | "COMMERCIAL" | null;
  classLevel: { id: string; name: string; section: "PRIMARY" | "JUNIOR" | "SENIOR"; rank: number };
};

export type CurrentPeriod = {
  session: { id: string; name: string } | null;
  term: { id: string; name: string; sequence: number } | null;
};

export const academicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listClassArms: builder.query<ClassArmOption[], void>({
      query: () => ({ url: "/academic/arms" }),
      providesTags: ["ClassArm"],
    }),

    // Registration writes an enrolment into the current session, so the form
    // needs to know whether one is set before it lets anyone type.
    getCurrentPeriod: builder.query<CurrentPeriod, void>({
      query: () => ({ url: "/academic/current" }),
      providesTags: ["Session", "Term"],
    }),
  }),
});

export const { useListClassArmsQuery, useGetCurrentPeriodQuery } = academicApi;
