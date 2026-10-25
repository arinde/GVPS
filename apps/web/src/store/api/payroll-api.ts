import { baseApi } from "@/store/api/base-api";
import type { StaffRole } from "@/store/api/staff-api";

export type PayLine = { name: string; amountKobo: number };
/** A salary structure and a payslip share this shape: basic pay, what is added, what is taken off. */
export type PayLines = { basicKobo: number; allowances: PayLine[]; deductions: PayLine[] };
export type PayTotals = { grossKobo: number; deductionsKobo: number; netKobo: number };

export type SalaryRow = {
  staff: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    roles: { role: StaffRole }[];
  };
  salary: (PayLines & PayTotals & { updatedAt: string }) | null;
};

export type PayrollRunStatus = "DRAFT" | "FINALISED";

export type PayrollRunSummary = PayTotals & {
  id: string;
  year: number;
  month: number;
  label: string;
  status: PayrollRunStatus;
  finalisedAt: string | null;
  staffCount: number;
};

/** Who a payslip was for, as at generation (finalise refreshes it). The account number is masked. */
export type PayslipStaff = {
  name: string;
  email: string;
  roles: StaffRole[];
  bankName: string | null;
  accountNumberMasked: string | null;
  accountName: string | null;
};

export type Payslip = PayLines &
  PayTotals & {
    id: string;
    runId: string;
    staffId: string;
    staff: PayslipStaff;
  };

export type SchoolLetterhead = { name: string; address: string | null; phone: string | null; email: string | null };

export type PayrollRun = PayrollRunSummary & { school: SchoolLetterhead; payslips: Payslip[] };

/** Everything one printed payslip needs. */
export type PrintablePayslip = Payslip & {
  school: SchoolLetterhead;
  label: string;
  status: PayrollRunStatus;
  finalisedAt: string | null;
};

export type MyPayslip = PayTotals & { id: string; label: string; run: { year: number; month: number } };

export type BankScheduleRow = {
  staffName: string;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  netKobo: number;
  missingAccount: boolean;
  /** The account on record differs from the one the payslip was finalised with. */
  accountChanged: boolean;
};
export type BankSchedule = { label: string; totalKobo: number; rows: BankScheduleRow[] };

/** FEATURES.md §9.4 — salary structures, monthly payroll runs and payslips. */
export const payrollApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSalaries: builder.query<SalaryRow[], void>({
      query: () => ({ url: "/payroll/salaries" }),
      providesTags: ["Salary"],
    }),
    saveSalary: builder.mutation<unknown, PayLines & { staffId: string }>({
      query: ({ staffId, ...body }) => ({ url: `/payroll/salaries/${staffId}`, method: "PUT", body }),
      invalidatesTags: ["Salary"],
    }),

    listPayrollRuns: builder.query<PayrollRunSummary[], void>({
      query: () => ({ url: "/payroll/runs" }),
      providesTags: ["PayrollRun"],
    }),
    getPayrollRun: builder.query<PayrollRun, string>({
      query: (runId) => ({ url: `/payroll/runs/${runId}` }),
      providesTags: ["PayrollRun", "Payslip"],
    }),
    createPayrollRun: builder.mutation<PayrollRun, { year: number; month: number }>({
      query: (body) => ({ url: "/payroll/runs", method: "POST", body }),
      invalidatesTags: ["PayrollRun"],
    }),
    refreshPayrollRun: builder.mutation<PayrollRun, string>({
      query: (runId) => ({ url: `/payroll/runs/${runId}/refresh`, method: "POST" }),
      invalidatesTags: ["PayrollRun", "Payslip"],
    }),
    finalisePayrollRun: builder.mutation<PayrollRun, string>({
      query: (runId) => ({ url: `/payroll/runs/${runId}/finalise`, method: "POST" }),
      invalidatesTags: ["PayrollRun", "Payslip"],
    }),
    deletePayrollRun: builder.mutation<unknown, string>({
      query: (runId) => ({ url: `/payroll/runs/${runId}`, method: "DELETE" }),
      invalidatesTags: ["PayrollRun"],
    }),

    // Full account numbers: fetched on demand, never kept in the cache.
    getBankSchedule: builder.query<BankSchedule, string>({
      query: (runId) => ({ url: `/payroll/runs/${runId}/bank-schedule` }),
      keepUnusedDataFor: 0,
    }),

    updatePayslip: builder.mutation<unknown, PayLines & { payslipId: string }>({
      query: ({ payslipId, ...body }) => ({ url: `/payroll/payslips/${payslipId}`, method: "PUT", body }),
      invalidatesTags: ["PayrollRun", "Payslip"],
    }),
    listMyPayslips: builder.query<MyPayslip[], void>({
      query: () => ({ url: "/payroll/payslips/mine" }),
      providesTags: ["Payslip"],
    }),
    getPayslip: builder.query<PrintablePayslip, string>({
      query: (payslipId) => ({ url: `/payroll/payslips/${payslipId}` }),
      providesTags: ["Payslip"],
    }),
  }),
});

export const {
  useListSalariesQuery,
  useSaveSalaryMutation,
  useListPayrollRunsQuery,
  useGetPayrollRunQuery,
  useCreatePayrollRunMutation,
  useRefreshPayrollRunMutation,
  useFinalisePayrollRunMutation,
  useDeletePayrollRunMutation,
  useUpdatePayslipMutation,
  useListMyPayslipsQuery,
  useLazyGetPayslipQuery,
  useLazyGetBankScheduleQuery,
} = payrollApi;
