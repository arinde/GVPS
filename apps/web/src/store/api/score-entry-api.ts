import { baseApi } from "@/store/api/base-api";

export type ScoreStudent = { id: string; firstName: string; lastName: string; admissionNo: string };
export type ScoreComponent = { id: string; name: string; maxScore: number };
export type Score = { studentId: string; assessmentComponentId: string; value: number };

export type ScoreGrid = { students: ScoreStudent[]; components: ScoreComponent[]; scores: Score[] };

export type ScoreGridRequest = { termId: string; subjectId: string; classArmId: string };
export type SaveScoreRequest = ScoreGridRequest & { studentId: string; assessmentComponentId: string; value: number };

export type ScoreSaveResult = { studentId: string; assessmentComponentId: string; ok: boolean; error?: string };
export type SaveScoreBatchRequest = ScoreGridRequest & { scores: Score[] };

/** §5.3 score entry — saved a whole row at a time; each cell is still applied independently server-side. */
export const scoreEntryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getScoreGrid: builder.query<ScoreGrid, ScoreGridRequest>({
      query: ({ termId, subjectId, classArmId }) => ({
        url: `/assessment/scores/${termId}/${subjectId}/${classArmId}`,
      }),
      providesTags: ["Score"],
    }),

    saveScore: builder.mutation<void, SaveScoreRequest>({
      query: ({ termId, subjectId, classArmId, ...body }) => ({
        url: `/assessment/scores/${termId}/${subjectId}/${classArmId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Score"],
    }),

    saveScoreBatch: builder.mutation<ScoreSaveResult[], SaveScoreBatchRequest>({
      query: ({ termId, subjectId, classArmId, scores }) => ({
        url: `/assessment/scores/${termId}/${subjectId}/${classArmId}/batch`,
        method: "PUT",
        body: { scores },
      }),
      invalidatesTags: ["Score"],
    }),
  }),
});

export const { useGetScoreGridQuery, useSaveScoreMutation, useSaveScoreBatchMutation } = scoreEntryApi;
