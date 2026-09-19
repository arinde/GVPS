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
  dateOfAdmission: string;
  classArmId: string;
  /** Department — senior (SSS) students only. */
  stream?: "SCIENCE" | "ARTS" | "COMMERCIAL";
  address?: string;
  bloodGroup?: string;
  medicalNote?: string;
  previousSchool?: string;
  guardians: GuardianInput[];
};

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
  dateOfAdmission: string;
  address: string | null;
  bloodGroup: string | null;
  medicalNote: string | null;
  previousSchool: string | null;
  admittedIntoLevel: { name: string };
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

    registerStudent: builder.mutation<RegisteredStudent, RegisterStudentRequest>({
      query: (body) => ({ url: "/students", method: "POST", body }),
      invalidatesTags: ["Student", "Enrolment"],
    }),
  }),
});

export const { useRegisterStudentMutation, useListStudentsQuery, useGetStudentQuery } = studentsApi;
