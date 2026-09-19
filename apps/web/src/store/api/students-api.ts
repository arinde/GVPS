import { baseApi } from "@/store/api/base-api";

export type GuardianInput = {
  firstName: string;
  lastName: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address?: string;
  occupation?: string;
  relationship: "FATHER" | "MOTHER" | "GUARDIAN";
  isPrimary: boolean;
};

export type RegisterStudentRequest = {
  firstName: string;
  lastName: string;
  otherNames?: string;
  dateOfBirth: string;
  sex: "MALE" | "FEMALE";
  nationality?: string;
  stateOfOrigin?: string;
  lga?: string;
  /** Sets the admission number's year. */
  admissionYear: number;
  /** Optional: older records often have only the year. */
  dateOfAdmission?: string;
  classArmId: string;
  /** Department — senior (SSS) students only. */
  stream?: "SCIENCE" | "ARTS" | "COMMERCIAL";
  address?: string;
  bloodGroup?: string;
  medicalNote?: string;
  previousSchool?: string;
  guardians: GuardianInput[];
};

/** What a superadmin can correct on a registered student. */
export type UpdateStudentRequest = Pick<
  RegisterStudentRequest,
  | "firstName"
  | "lastName"
  | "otherNames"
  | "dateOfBirth"
  | "sex"
  | "stateOfOrigin"
  | "lga"
  | "address"
  | "bloodGroup"
  | "medicalNote"
  | "previousSchool"
  | "dateOfAdmission"
>;

export type UpdateGuardianRequest = Pick<
  GuardianInput,
  "firstName" | "lastName" | "phone" | "altPhone" | "email" | "occupation"
>;

export type RegisteredStudent = {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
};

export type StudentListRow = {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  sex: "MALE" | "FEMALE";
  admittedIntoLevel: { id: string; name: string };
  enrolments: { classArm: { name: string; classLevel: { name: string } } }[];
};

export type StudentPage = { students: StudentListRow[]; nextCursor: string | null };
export type StudentSearchArgs = { q?: string; armId?: string; cursor?: string };

type ArmWithLevel = { name: string; classLevel: { name: string } };

/** One student's full record, as the profile page shows it. */
export type StudentProfile = {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  dateOfBirth: string;
  sex: "MALE" | "FEMALE";
  nationality: string;
  stateOfOrigin: string | null;
  lga: string | null;
  admissionYear: number;
  dateOfAdmission: string | null;
  address: string | null;
  bloodGroup: string | null;
  medicalNote: string | null;
  previousSchool: string | null;
  admittedIntoLevel: { name: string };
  /** Present when a passport photograph exists; the image is fetched separately. */
  photo: { updatedAt: string } | null;
  guardians: {
    relationship: "FATHER" | "MOTHER" | "GUARDIAN";
    isPrimary: boolean;
    guardian: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      altPhone: string | null;
      email: string | null;
      occupation: string | null;
    };
  }[];
  enrolments: {
    id: string;
    status: string;
    stream: "SCIENCE" | "ARTS" | "COMMERCIAL" | null;
    enrolledOn: string;
    session: { name: string };
    classArm: ArmWithLevel;
  }[];
  /** Other children of the same guardians — empty for readers limited to their own classes. */
  siblings: { id: string; firstName: string; lastName: string; className: string | null }[];
};

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listStudents: builder.query<StudentPage, StudentSearchArgs>({
      query: (args) => ({ url: "/students", params: args }),
      providesTags: ["Student"],
    }),

    getStudent: builder.query<StudentProfile, string>({
      query: (studentId) => ({ url: `/students/${studentId}` }),
      providesTags: (_result, _error, studentId) => [{ type: "Student", id: studentId }],
    }),

    // Keyed on the photo's updatedAt as well, so a new photo is a new cache
    // entry rather than a stale image.
    getStudentPhoto: builder.query<{ dataUrl: string }, { studentId: string; version: string }>({
      query: ({ studentId }) => ({ url: `/students/${studentId}/photo` }),
    }),

    setStudentPhoto: builder.mutation<unknown, { studentId: string; mimeType: string; base64: string }>({
      query: ({ studentId, ...body }) => ({ url: `/students/${studentId}/photo`, method: "PUT", body }),
      invalidatesTags: (_result, _error, { studentId }) => [{ type: "Student", id: studentId }, "Dashboard"],
    }),

    // Superadmin corrections. The profile refreshes, and the dashboard's
    // activity feed with it.
    updateStudent: builder.mutation<{ changed: boolean }, { studentId: string; details: UpdateStudentRequest }>({
      query: ({ studentId, details }) => ({ url: `/students/${studentId}`, method: "PUT", body: details }),
      invalidatesTags: (_result, _error, { studentId }) => [{ type: "Student", id: studentId }, "Student", "Dashboard"],
    }),

    // A guardian can be shared by siblings, so every student record refreshes.
    updateGuardian: builder.mutation<{ changed: boolean }, { guardianId: string; details: UpdateGuardianRequest }>({
      query: ({ guardianId, details }) => ({ url: `/students/guardians/${guardianId}`, method: "PUT", body: details }),
      invalidatesTags: ["Student", "Dashboard"],
    }),

    registerStudent: builder.mutation<RegisteredStudent, RegisterStudentRequest>({
      query: (body) => ({ url: "/students", method: "POST", body }),
      invalidatesTags: ["Student", "Enrolment", "Dashboard"],
    }),
  }),
});

export const {
  useRegisterStudentMutation,
  useListStudentsQuery,
  useGetStudentQuery,
  useGetStudentPhotoQuery,
  useSetStudentPhotoMutation,
  useUpdateStudentMutation,
  useUpdateGuardianMutation,
} = studentsApi;
