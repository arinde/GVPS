import { baseApi } from "@/store/api/base-api";

export type TeachingResourceType = "SCHEME_OF_WORK" | "LECTURE_NOTE" | "EXAM_QUESTIONS";
export type TeachingResourceStatus = "DRAFT" | "SUBMITTED" | "APPROVED";

export type SchemeOfWorkWeek = {
  week: number;
  topic: string;
  objectives: string;
  activities: string;
  resources: string;
};
export type SchemeOfWorkContent = { weeks: SchemeOfWorkWeek[] };

export type LectureNoteContent = { objectives: string; body: string; references: string };

export type ExamQuestion = {
  number: number;
  text: string;
  type: "OBJECTIVE" | "THEORY";
  options: string[];
  correctAnswer: string;
  marks: number;
};
export type ExamQuestionsContent = { instructions: string; questions: ExamQuestion[] };

export type TeachingResourceContent = SchemeOfWorkContent | LectureNoteContent | ExamQuestionsContent;

export type TeachingResource = {
  id: string;
  type: TeachingResourceType;
  title: string;
  subjectId: string;
  classLevelId: string;
  termId: string;
  status: TeachingResourceStatus;
  content: TeachingResourceContent;
  createdById: string;
  submittedAt: string | null;
  submittedById: string | null;
  approvedAt: string | null;
  approvedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaveTeachingResourceRequest = {
  type: TeachingResourceType;
  title: string;
  subjectId: string;
  classLevelId: string;
  termId: string;
  content: TeachingResourceContent;
};

export type TeachingResourceFilter = {
  type?: TeachingResourceType;
  subjectId?: string;
  classLevelId?: string;
  termId?: string;
};

/** Scheme of work, lecture notes and exam questions — structured templates any staff can fill in for any class. */
export const teachingResourcesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listTeachingResources: builder.query<TeachingResource[], TeachingResourceFilter | void>({
      query: (filter) => ({ url: "/teaching-resources", params: filter ?? undefined }),
      providesTags: ["TeachingResource"],
    }),
    getTeachingResource: builder.query<TeachingResource, string>({
      query: (id) => ({ url: `/teaching-resources/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "TeachingResource", id }],
    }),
    createTeachingResource: builder.mutation<TeachingResource, SaveTeachingResourceRequest>({
      query: (body) => ({ url: "/teaching-resources", method: "POST", body }),
      invalidatesTags: ["TeachingResource"],
    }),
    updateTeachingResource: builder.mutation<TeachingResource, { id: string; body: SaveTeachingResourceRequest }>({
      query: ({ id, body }) => ({ url: `/teaching-resources/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => ["TeachingResource", { type: "TeachingResource", id }],
    }),
    submitTeachingResource: builder.mutation<TeachingResource, string>({
      query: (id) => ({ url: `/teaching-resources/${id}/submit`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => ["TeachingResource", { type: "TeachingResource", id }],
    }),
    approveTeachingResource: builder.mutation<TeachingResource, string>({
      query: (id) => ({ url: `/teaching-resources/${id}/approve`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => ["TeachingResource", { type: "TeachingResource", id }],
    }),
    rejectTeachingResource: builder.mutation<TeachingResource, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/teaching-resources/${id}/reject`, method: "POST", body: { reason } }),
      invalidatesTags: (_result, _error, { id }) => ["TeachingResource", { type: "TeachingResource", id }],
    }),
    deleteTeachingResource: builder.mutation<void, string>({
      query: (id) => ({ url: `/teaching-resources/${id}`, method: "DELETE" }),
      invalidatesTags: ["TeachingResource"],
    }),
  }),
});

export const {
  useListTeachingResourcesQuery,
  useGetTeachingResourceQuery,
  useCreateTeachingResourceMutation,
  useUpdateTeachingResourceMutation,
  useSubmitTeachingResourceMutation,
  useApproveTeachingResourceMutation,
  useRejectTeachingResourceMutation,
  useDeleteTeachingResourceMutation,
} = teachingResourcesApi;
