import { baseApi } from "@/store/api/base-api";

export type ClassArmOption = {
  id: string;
  name: string;
  capacity: number | null;
  stream: "SCIENCE" | "ARTS" | "COMMERCIAL" | null;
  classLevel: { id: string; name: string; section: "NURSERY" | "PRIMARY" | "JUNIOR" | "SENIOR"; rank: number };
};

type Section = ClassArmOption["classLevel"]["section"];

/** A class level with its arms, as the class setup screen lists them. */
export type ClassLevelWithArms = {
  id: string;
  name: string;
  section: Section;
  rank: number;
  arms: { id: string; name: string; capacity: number | null }[];
};

export type CreateClassArmRequest = { levelId: string; name: string; capacity?: number };

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

    listClassLevels: builder.query<ClassLevelWithArms[], void>({
      query: () => ({ url: "/academic/levels" }),
      providesTags: ["ClassArm"],
    }),

    // A new or resized class changes the registration form's class list, the
    // allocation page and the dashboard's progress, so all three refresh.
    createClassArm: builder.mutation<unknown, CreateClassArmRequest>({
      query: ({ levelId, ...body }) => ({ url: `/academic/levels/${levelId}/arms`, method: "POST", body }),
      invalidatesTags: ["ClassArm", "ClassAssignment", "Dashboard"],
    }),

    updateClassArm: builder.mutation<unknown, { armId: string; capacity: number | null }>({
      query: ({ armId, capacity }) => ({ url: `/academic/arms/${armId}`, method: "PATCH", body: { capacity } }),
      invalidatesTags: ["ClassArm", "Dashboard"],
    }),

    // Registration writes an enrolment into the current session, so the form
    // needs to know whether one is set before it lets anyone type.
    getCurrentPeriod: builder.query<CurrentPeriod, void>({
      query: () => ({ url: "/academic/current" }),
      providesTags: ["Session", "Term"],
    }),
  }),
});

export const {
  useListClassArmsQuery,
  useListClassLevelsQuery,
  useCreateClassArmMutation,
  useUpdateClassArmMutation,
  useGetCurrentPeriodQuery,
} = academicApi;
