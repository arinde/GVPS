import { baseApi } from "@/store/api/base-api";

export type ResultSheetStatus = "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "PUBLISHED";

export type ApprovalSubject = {
  subjectId: string;
  subjectName: string;
  teacherName: string;
  status: ResultSheetStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  unlockReason: string | null;
};

export type ApprovalStatus = { subjects: ApprovalSubject[] };

export type SubjectScores = {
  components: { id: string; name: string; maxScore: number }[];
  rows: {
    studentId: string;
    name: string;
    admissionNo: string;
    values: { componentId: string; value: number | null }[];
    total: number;
  }[];
};

type ArmTarget = { termId: string; classArmId: string };
type SubjectTarget = ArmTarget & { subjectId: string };

/** FEATURES.md §5.4 — the approval workflow for one class arm in one term. */
export const approvalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getApprovalStatus: builder.query<ApprovalStatus, ArmTarget>({
      query: ({ termId, classArmId }) => ({ url: `/assessment/approval/terms/${termId}/arms/${classArmId}` }),
      providesTags: ["ResultSheet"],
    }),
    getSubjectScores: builder.query<SubjectScores, SubjectTarget>({
      query: ({ termId, classArmId, subjectId }) => ({
        url: `/assessment/approval/terms/${termId}/arms/${classArmId}/subjects/${subjectId}/scores`,
      }),
      providesTags: ["Score"],
    }),
    submitSheet: builder.mutation<unknown, SubjectTarget>({
      query: ({ termId, classArmId, subjectId }) => ({
        url: `/assessment/approval/terms/${termId}/arms/${classArmId}/subjects/${subjectId}/submit`,
        method: "POST",
      }),
      invalidatesTags: ["ResultSheet", "Score"],
    }),
    reviewSheet: builder.mutation<unknown, SubjectTarget>({
      query: ({ termId, classArmId, subjectId }) => ({
        url: `/assessment/approval/terms/${termId}/arms/${classArmId}/subjects/${subjectId}/review`,
        method: "POST",
      }),
      invalidatesTags: ["ResultSheet"],
    }),
    approveSheet: builder.mutation<unknown, SubjectTarget>({
      query: ({ termId, classArmId, subjectId }) => ({
        url: `/assessment/approval/terms/${termId}/arms/${classArmId}/subjects/${subjectId}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["ResultSheet"],
    }),
    unlockSheet: builder.mutation<unknown, SubjectTarget & { reason: string }>({
      query: ({ termId, classArmId, subjectId, reason }) => ({
        url: `/assessment/approval/terms/${termId}/arms/${classArmId}/subjects/${subjectId}/unlock`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["ResultSheet", "Score"],
    }),
    publishArm: builder.mutation<{ published: number }, ArmTarget>({
      query: ({ termId, classArmId }) => ({
        url: `/assessment/approval/terms/${termId}/arms/${classArmId}/publish`,
        method: "POST",
      }),
      invalidatesTags: ["ResultSheet"],
    }),
  }),
});

export const {
  useGetApprovalStatusQuery,
  useGetSubjectScoresQuery,
  useSubmitSheetMutation,
  useReviewSheetMutation,
  useApproveSheetMutation,
  useUnlockSheetMutation,
  usePublishArmMutation,
} = approvalApi;
