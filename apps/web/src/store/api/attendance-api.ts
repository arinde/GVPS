import { baseApi } from "@/store/api/base-api";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

export type AttendanceStudent = { id: string; firstName: string; lastName: string; admissionNo: string };
export type AttendanceMark = { studentId: string; status: AttendanceStatus };
export type AttendanceRecord = AttendanceMark & { id: string };
export type AttendanceRegister = { students: AttendanceStudent[]; marks: AttendanceRecord[] };
export type AttendanceSummary = { timesPresent: number; timesSchoolOpened: number | null };

/** FEATURES.md §4.1/4.2 — daily (Primary/Junior) and period (Senior) attendance registers. */
export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDailyAttendance: builder.query<AttendanceRegister, { classArmId: string; date: string }>({
      query: ({ classArmId, date }) => ({ url: `/attendance/arms/${classArmId}/daily`, params: { date } }),
      providesTags: ["Attendance"],
    }),
    markDailyAttendance: builder.mutation<void, { classArmId: string; date: string; marks: AttendanceMark[] }>({
      query: ({ classArmId, date, marks }) => ({
        url: `/attendance/arms/${classArmId}/daily`,
        method: "POST",
        body: { date, marks },
      }),
      invalidatesTags: ["Attendance"],
    }),

    getPeriodAttendance: builder.query<
      AttendanceRegister,
      { classArmId: string; subjectId: string; periodId: string; date: string }
    >({
      query: ({ classArmId, subjectId, periodId, date }) => ({
        url: `/attendance/arms/${classArmId}/subjects/${subjectId}/periods/${periodId}`,
        params: { date },
      }),
      providesTags: ["Attendance"],
    }),
    markPeriodAttendance: builder.mutation<
      void,
      { classArmId: string; subjectId: string; periodId: string; date: string; marks: AttendanceMark[] }
    >({
      query: ({ classArmId, subjectId, periodId, date, marks }) => ({
        url: `/attendance/arms/${classArmId}/subjects/${subjectId}/periods/${periodId}`,
        method: "POST",
        body: { date, marks },
      }),
      invalidatesTags: ["Attendance"],
    }),

    getAttendanceSummary: builder.query<AttendanceSummary, { studentId: string; termId: string }>({
      query: ({ studentId, termId }) => ({ url: `/attendance/students/${studentId}/terms/${termId}/summary` }),
      providesTags: ["Attendance"],
    }),
  }),
});

export const {
  useGetDailyAttendanceQuery,
  useMarkDailyAttendanceMutation,
  useGetPeriodAttendanceQuery,
  useMarkPeriodAttendanceMutation,
  useGetAttendanceSummaryQuery,
} = attendanceApi;
