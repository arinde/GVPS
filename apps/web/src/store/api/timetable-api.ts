import { baseApi } from "@/store/api/base-api";

export type Section = "NURSERY" | "PRIMARY" | "JUNIOR" | "SENIOR";
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
export const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
};

export type Period = {
  id: string;
  section: Section;
  name: string;
  startTime: string;
  endTime: string;
  sequence: number;
  isTeaching: boolean;
};

export type TimetableSlotView = {
  id: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
  subjectId: string;
  subjectName: string;
  // Null until a teacher is assigned — placed anyway, filled in on the next regenerate.
  staffId: string | null;
  staffName: string;
  // Set when this subject is pinned to one day (Sports every Wednesday) — a fixture, not a regular lesson.
  fixedDay: DayOfWeek | null;
};

export type ArmGrid = { classLabel: string; days: DayOfWeek[]; periods: Period[]; slots: TimetableSlotView[] };

export type AvailableSubject = {
  subjectId: string;
  subjectName: string;
  staffName: string | null;
  periodsPerWeek: number;
  fixedDay: DayOfWeek | null;
};

export type AddableSubject = { subjectId: string; subjectName: string };

export type AutoGenerateResult = {
  placed: number;
  // Lessons placed with no teacher yet — still drafted, just unstaffed until one is assigned.
  placedWithoutTeacher: number;
  unplaced: { subjectId: string; subjectName: string; missing: number }[];
};

export type StaffScheduleSlot = { dayOfWeek: DayOfWeek; periodId: string; classLabel: string; subjectName: string };
export type StaffScheduleSection = {
  section: Section;
  days: DayOfWeek[];
  periods: Period[];
  slots: StaffScheduleSlot[];
};
export type StaffTimetable = { sections: StaffScheduleSection[] };

type CreatePeriodBody = { section: Section; name: string; startTime: string; endTime: string; isTeaching: boolean };
type UpdatePeriodBody = { name: string; startTime: string; endTime: string; isTeaching: boolean };

/** FEATURES.md §8.1 — period definitions and the arm-by-arm timetable builder. */
export const timetableApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPeriods: builder.query<Period[], Section>({
      query: (section) => ({ url: "/timetable/periods", params: { section } }),
      providesTags: ["Period"],
    }),
    createPeriod: builder.mutation<Period, CreatePeriodBody>({
      query: (body) => ({ url: "/timetable/periods", method: "POST", body }),
      invalidatesTags: ["Period"],
    }),
    updatePeriod: builder.mutation<Period, { periodId: string } & UpdatePeriodBody>({
      query: ({ periodId, ...body }) => ({ url: `/timetable/periods/${periodId}`, method: "PUT", body }),
      invalidatesTags: ["Period"],
    }),
    deletePeriod: builder.mutation<void, string>({
      query: (periodId) => ({ url: `/timetable/periods/${periodId}`, method: "DELETE" }),
      invalidatesTags: ["Period"],
    }),

    getArmGrid: builder.query<ArmGrid, { sessionId: string; classArmId: string }>({
      query: ({ sessionId, classArmId }) => ({ url: `/timetable/sessions/${sessionId}/arms/${classArmId}` }),
      providesTags: ["TimetableSlot"],
    }),
    getAvailableSubjects: builder.query<AvailableSubject[], { sessionId: string; classArmId: string }>({
      query: ({ sessionId, classArmId }) => ({
        url: `/timetable/sessions/${sessionId}/arms/${classArmId}/subjects`,
      }),
      providesTags: ["TimetableSlot"],
    }),
    getAddableSubjects: builder.query<AddableSubject[], { sessionId: string; classArmId: string }>({
      query: ({ sessionId, classArmId }) => ({
        url: `/timetable/sessions/${sessionId}/arms/${classArmId}/subjects/addable`,
      }),
      providesTags: ["TimetableSlot"],
    }),
    addSubject: builder.mutation<unknown, { sessionId: string; classArmId: string; subjectId: string }>({
      query: ({ sessionId, classArmId, subjectId }) => ({
        url: `/timetable/sessions/${sessionId}/arms/${classArmId}/subjects/${subjectId}`,
        method: "POST",
      }),
      invalidatesTags: ["TimetableSlot"],
    }),
    removeSubject: builder.mutation<void, { sessionId: string; classArmId: string; subjectId: string }>({
      query: ({ sessionId, classArmId, subjectId }) => ({
        url: `/timetable/sessions/${sessionId}/arms/${classArmId}/subjects/${subjectId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TimetableSlot"],
    }),
    setSubjectLoad: builder.mutation<
      unknown,
      { sessionId: string; classArmId: string; subjectId: string; periodsPerWeek: number; fixedDay: DayOfWeek | null }
    >({
      query: ({ sessionId, classArmId, subjectId, periodsPerWeek, fixedDay }) => ({
        url: `/timetable/sessions/${sessionId}/arms/${classArmId}/subjects/${subjectId}/load`,
        method: "PUT",
        body: { periodsPerWeek, fixedDay },
      }),
      invalidatesTags: ["TimetableSlot"],
    }),
    autoGenerate: builder.mutation<AutoGenerateResult, { sessionId: string; classArmId: string }>({
      query: ({ sessionId, classArmId }) => ({
        url: `/timetable/sessions/${sessionId}/arms/${classArmId}/auto-generate`,
        method: "POST",
      }),
      invalidatesTags: ["TimetableSlot"],
    }),
    setSlot: builder.mutation<
      unknown,
      { sessionId: string; classArmId: string; day: DayOfWeek; periodId: string; subjectId: string }
    >({
      query: ({ sessionId, classArmId, day, periodId, subjectId }) => ({
        url: `/timetable/sessions/${sessionId}/arms/${classArmId}/days/${day}/periods/${periodId}`,
        method: "PUT",
        body: { subjectId },
      }),
      invalidatesTags: ["TimetableSlot"],
    }),
    clearSlot: builder.mutation<void, string>({
      query: (slotId) => ({ url: `/timetable/slots/${slotId}`, method: "DELETE" }),
      invalidatesTags: ["TimetableSlot"],
    }),

    getStaffTimetable: builder.query<StaffTimetable, { sessionId: string; staffId: string }>({
      query: ({ sessionId, staffId }) => ({ url: `/timetable/sessions/${sessionId}/staff/${staffId}` }),
      providesTags: ["TimetableSlot"],
    }),
  }),
});

export const {
  useListPeriodsQuery,
  useCreatePeriodMutation,
  useUpdatePeriodMutation,
  useDeletePeriodMutation,
  useGetArmGridQuery,
  useGetAvailableSubjectsQuery,
  useGetAddableSubjectsQuery,
  useAddSubjectMutation,
  useRemoveSubjectMutation,
  useSetSubjectLoadMutation,
  useAutoGenerateMutation,
  useSetSlotMutation,
  useClearSlotMutation,
  useGetStaffTimetableQuery,
} = timetableApi;
