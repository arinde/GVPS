import { baseApi } from "@/store/api/base-api";

export type StaffRole = "SUPERADMIN" | "PRINCIPAL" | "BURSAR" | "FORM_TEACHER" | "SUBJECT_TEACHER" | "ADMIN_SECRETARY";

type ArmSummary = { id: string; name: string; classLevel: { name: string } };

export type StaffMember = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  otherNames: string | null;
  phone: string | null;
  mustChangePassword: boolean;
  roles: { role: StaffRole }[];
  /** This session's class allocations. */
  classAssignments: { id: string; classArm: ArmSummary }[];
};

/** A full staff record: the superadmin's view of anyone, or a person's own. */
export type StaffProfile = Omit<StaffMember, "classAssignments"> & {
  address: string | null;
  nextOfKinName: string | null;
  nextOfKinRelationship: string | null;
  nextOfKinPhone: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  createdAt: string;
  classAssignments: { id: string; classArm: ArmSummary }[];
};

export type CreateStaffRequest = {
  firstName: string;
  lastName: string;
  otherNames?: string;
  phone: string;
  email: string;
  address: string;
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
  /** Salary account: optional, but all three or none. */
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  roles: StaffRole[];
};
export type CreateStaffResponse = { staffId: string; temporaryPassword: string };

type TeacherSummary = { id: string; firstName: string | null; lastName: string | null; email: string };

export type ClassAllocation = {
  session: { id: string; name: string };
  maxClassesPerTeacher: number;
  classes: (ArmSummary & {
    classLevel: { name: string; section: string; rank: number };
    teacher: TeacherSummary | null;
  })[];
};

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // The signed-in person's own record. Read-only by design: changes to
    // your own details, above all your salary account, go through the
    // superadmin.
    getMyProfile: builder.query<StaffProfile, void>({
      query: () => ({ url: "/me/profile" }),
      providesTags: ["Staff"],
    }),

    listStaff: builder.query<StaffMember[], void>({
      query: () => ({ url: "/auth/staff" }),
      providesTags: ["Staff"],
    }),

    createStaff: builder.mutation<CreateStaffResponse, CreateStaffRequest>({
      query: (body) => ({ url: "/auth/staff", method: "POST", body }),
      invalidatesTags: ["Staff"],
    }),

    getClassAllocation: builder.query<ClassAllocation, void>({
      query: () => ({ url: "/class-assignments" }),
      providesTags: ["ClassAssignment"],
    }),

    // Changing a class's teacher changes that teacher's class list and access,
    // so the staff list and access caches are refreshed along with it.
    setClassTeacher: builder.mutation<unknown, { classArmId: string; staffId: string | null }>({
      query: ({ classArmId, staffId }) => ({
        url: `/class-assignments/${classArmId}`,
        method: "PUT",
        body: { staffId },
      }),
      invalidatesTags: ["ClassAssignment", "Staff", "Access"],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useListStaffQuery,
  useCreateStaffMutation,
  useGetClassAllocationQuery,
  useSetClassTeacherMutation,
} = staffApi;
