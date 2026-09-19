import { baseApi } from "@/store/api/base-api";

type Section = "NURSERY" | "PRIMARY" | "JUNIOR" | "SENIOR";
export type Department = "SCIENCE" | "ARTS" | "COMMERCIAL";

export type SubjectOffering = {
  id: string;
  stream: Department | null;
  isCore: boolean;
  passMark: number | null;
  classLevel: { id: string; name: string; section: Section; rank: number };
};

export type Subject = { id: string; name: string; code: string; offerings: SubjectOffering[] };

export type SubjectRequest = { name: string; code: string };

export type AddOfferingsRequest = { subjectId: string; classLevelIds: string[]; stream?: Department; isCore: boolean };

type ArmRef = { id: string; name: string; classLevel: { name: string } };
type TeacherRef = { id: string; firstName: string | null; lastName: string | null; email: string };

export type TeachingAssignment = { id: string; subject: { id: string; name: string; code: string }; classArm: ArmRef };

/** A class a subject can be taught in, with whoever teaches it there now. */
export type SubjectClassOption = ArmRef & { subjectAssignments: { staff: TeacherRef }[] };

/** The subject catalogue, where subjects are offered, and who teaches them. */
export const subjectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSubjects: builder.query<Subject[], void>({
      query: () => ({ url: "/subjects" }),
      providesTags: ["Subject"],
    }),
    createSubject: builder.mutation<Subject, SubjectRequest>({
      query: (body) => ({ url: "/subjects", method: "POST", body }),
      invalidatesTags: ["Subject", "Dashboard"],
    }),
    updateSubject: builder.mutation<Subject, SubjectRequest & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/subjects/${id}`, method: "PUT", body }),
      invalidatesTags: ["Subject", "SubjectAssignment"],
    }),
    deleteSubject: builder.mutation<void, string>({
      query: (id) => ({ url: `/subjects/${id}`, method: "DELETE" }),
      invalidatesTags: ["Subject"],
    }),
    addOfferings: builder.mutation<{ added: number }, AddOfferingsRequest>({
      query: ({ subjectId, ...body }) => ({ url: `/subjects/${subjectId}/offerings`, method: "POST", body }),
      invalidatesTags: ["Subject", "SubjectAssignment"],
    }),
    updateOffering: builder.mutation<unknown, { id: string; isCore: boolean; passMark: number | null }>({
      query: ({ id, ...body }) => ({ url: `/subjects/offerings/${id}`, method: "PUT", body }),
      invalidatesTags: ["Subject"],
    }),
    removeOffering: builder.mutation<void, string>({
      query: (id) => ({ url: `/subjects/offerings/${id}`, method: "DELETE" }),
      invalidatesTags: ["Subject", "SubjectAssignment"],
    }),

    listTeachingAssignments: builder.query<TeachingAssignment[], string>({
      query: (staffId) => ({ url: `/subject-assignments/staff/${staffId}` }),
      providesTags: ["SubjectAssignment"],
    }),
    listSubjectClasses: builder.query<SubjectClassOption[], string>({
      query: (subjectId) => ({ url: `/subject-assignments/subject/${subjectId}/classes` }),
      providesTags: ["SubjectAssignment"],
    }),
    // A teaching assignment widens whose students a teacher can read, so access refreshes too.
    assignSubject: builder.mutation<
      { assigned: number },
      { staffId: string; subjectId: string; classArmIds: string[] }
    >({
      query: (body) => ({ url: "/subject-assignments", method: "POST", body }),
      invalidatesTags: ["SubjectAssignment", "Access", "Dashboard"],
    }),
    assignWholeClass: builder.mutation<{ assigned: number }, { staffId: string; classArmId: string }>({
      query: (body) => ({ url: "/subject-assignments/whole-class", method: "POST", body }),
      invalidatesTags: ["SubjectAssignment", "Access", "Dashboard"],
    }),
    unassignSubject: builder.mutation<void, string>({
      query: (id) => ({ url: `/subject-assignments/${id}`, method: "DELETE" }),
      invalidatesTags: ["SubjectAssignment", "Access", "Dashboard"],
    }),
  }),
});

export const {
  useListSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useAddOfferingsMutation,
  useUpdateOfferingMutation,
  useRemoveOfferingMutation,
  useListTeachingAssignmentsQuery,
  useListSubjectClassesQuery,
  useAssignSubjectMutation,
  useAssignWholeClassMutation,
  useUnassignSubjectMutation,
} = subjectsApi;
