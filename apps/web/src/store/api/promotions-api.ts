import { baseApi } from "@/store/api/base-api";
import type { Department } from "@/store/api/subjects-api";

export type PromotionCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  stream: Department | null;
};

export type PromotionCandidates = { session: { id: string; name: string }; students: PromotionCandidate[] };

export type PromoteRequest = {
  fromClassArmId: string;
  toSessionId: string;
  toClassArmId: string;
  stream?: Department;
  studentIds: string[];
};

export type PromotionResult = {
  promoted: number;
  reissued: number;
  /** Each moved student; `newNo` is present only where a secondary number was issued. */
  students: { name: string; from: string; to: string; oldNo?: string; newNo?: string }[];
};

export type ExitStatus = "TRANSFERRED" | "WITHDRAWN" | "GRADUATED";

/** Promotion, class transfer, and recording that a student has left (FEATURES.md §3.6). */
export const promotionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPromotionCandidates: builder.query<PromotionCandidates, string>({
      query: (classArmId) => ({ url: `/promotions/classes/${classArmId}` }),
      providesTags: ["Enrolment"],
    }),

    // New enrolments, and possibly new admission numbers, so the registry and
    // every dashboard figure are refreshed.
    promoteClass: builder.mutation<PromotionResult, PromoteRequest>({
      query: (body) => ({ url: "/promotions", method: "POST", body }),
      invalidatesTags: ["Enrolment", "Student", "Dashboard"],
    }),

    transferEnrolment: builder.mutation<
      unknown,
      { enrolmentId: string; studentId: string; classArmId: string; stream?: Department; reason?: string }
    >({
      // studentId is only for cache invalidation; the API takes the rest.
      query: ({ enrolmentId, classArmId, stream, reason }) => ({
        url: `/enrolments/${enrolmentId}/class`,
        method: "PUT",
        body: { classArmId, stream, reason },
      }),
      invalidatesTags: (_result, _error, { studentId }) => [
        { type: "Student", id: studentId },
        "Student",
        "Enrolment",
        "Dashboard",
      ],
    }),

    exitEnrolment: builder.mutation<
      unknown,
      { enrolmentId: string; studentId: string; status: ExitStatus; exitedOn: string; reason?: string }
    >({
      query: ({ enrolmentId, status, exitedOn, reason }) => ({
        url: `/enrolments/${enrolmentId}/exit`,
        method: "POST",
        body: { status, exitedOn, reason },
      }),
      invalidatesTags: (_result, _error, { studentId }) => [
        { type: "Student", id: studentId },
        "Student",
        "Enrolment",
        "Dashboard",
      ],
    }),
  }),
});

export const {
  useGetPromotionCandidatesQuery,
  usePromoteClassMutation,
  useTransferEnrolmentMutation,
  useExitEnrolmentMutation,
} = promotionsApi;
