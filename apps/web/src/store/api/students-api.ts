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

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listStudents: builder.query<StudentPage, StudentSearchArgs>({
      query: (args) => ({ url: "/students", params: args }),
      providesTags: ["Student"],
    }),

    registerStudent: builder.mutation<RegisteredStudent, RegisterStudentRequest>({
      query: (body) => ({ url: "/students", method: "POST", body }),
      invalidatesTags: ["Student", "Enrolment"],
    }),
  }),
});

export const { useRegisterStudentMutation, useListStudentsQuery } = studentsApi;
