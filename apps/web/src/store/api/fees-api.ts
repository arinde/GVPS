import { baseApi } from "@/store/api/base-api";

export type FeeItem = { id: string; name: string };
export type FeeStructureItem = {
  id: string;
  classLevelId: string;
  feeItemId: string;
  amountKobo: number;
  isCompulsory: boolean;
};

export type InvoiceLineItem = { id: string; feeItemId: string; name: string; amountKobo: number };
export type PaymentMethod = "CASH" | "TRANSFER" | "POS";
export type Payment = {
  id: string;
  receiptNumber: string;
  amountKobo: number;
  method: PaymentMethod;
  reference: string | null;
  payerName: string;
  receivedByName: string;
  reversedAt: string | null;
  reversalReason: string | null;
  createdAt: string;
};
export type InvoiceBalance = { totalDue: number; totalPaid: number; balance: number };
export type Invoice = {
  id: string;
  termId: string;
  studentId: string;
  openingBalanceKobo: number;
  createdAt: string;
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  balance: InvoiceBalance;
};
export type StudentLedger = { invoices: Invoice[]; outstanding: number };

export type Debtor = {
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string | null;
  balanceKobo: number;
};

export type SetStructureItemRequest = {
  termId: string;
  classLevelId: string;
  feeItemId: string;
  amountKobo: number;
  isCompulsory: boolean;
};
export type RecordPaymentRequest = {
  invoiceId: string;
  amountKobo: number;
  method: PaymentMethod;
  reference?: string;
  payerName: string;
  receivedByName: string;
};

/** FEATURES.md §6 — fee structure, invoicing, payments and the debtor list. */
export const feesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFeeItems: builder.query<FeeItem[], void>({
      query: () => ({ url: "/fees/structure/items" }),
      providesTags: ["FeeItem"],
    }),
    createFeeItem: builder.mutation<FeeItem, string>({
      query: (name) => ({ url: "/fees/structure/items", method: "POST", body: { name } }),
      invalidatesTags: ["FeeItem"],
    }),

    listFeeStructure: builder.query<FeeStructureItem[], string>({
      query: (termId) => ({ url: `/fees/structure/terms/${termId}` }),
      providesTags: ["FeeStructure"],
    }),
    setFeeStructureItem: builder.mutation<FeeStructureItem, SetStructureItemRequest>({
      query: ({ termId, ...body }) => ({ url: `/fees/structure/terms/${termId}`, method: "POST", body }),
      invalidatesTags: ["FeeStructure"],
    }),
    copyFeeStructure: builder.mutation<unknown, { termId: string; fromTermId: string }>({
      query: ({ termId, fromTermId }) => ({
        url: `/fees/structure/terms/${termId}/copy-from/${fromTermId}`,
        method: "POST",
      }),
      invalidatesTags: ["FeeStructure"],
    }),

    generateInvoices: builder.mutation<{ created: number; skipped: number }, { termId: string; classArmId: string }>({
      query: ({ termId, classArmId }) => ({
        url: `/fees/invoices/terms/${termId}/generate`,
        method: "POST",
        body: { classArmId },
      }),
      invalidatesTags: ["Invoice", "Debtor"],
    }),
    getStudentLedger: builder.query<StudentLedger, string>({
      query: (studentId) => ({ url: `/fees/invoices/students/${studentId}/ledger` }),
      providesTags: ["Invoice"],
    }),

    recordPayment: builder.mutation<Payment, RecordPaymentRequest>({
      query: ({ invoiceId, ...body }) => ({ url: `/fees/payments/invoices/${invoiceId}`, method: "POST", body }),
      invalidatesTags: ["Invoice", "Debtor"],
    }),
    reversePayment: builder.mutation<Payment, { paymentId: string; reason: string }>({
      query: ({ paymentId, reason }) => ({
        url: `/fees/payments/${paymentId}/reverse`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Invoice", "Debtor"],
    }),

    listDebtors: builder.query<Debtor[], void>({
      query: () => ({ url: "/fees/debtors" }),
      providesTags: ["Debtor"],
    }),
  }),
});

export const {
  useListFeeItemsQuery,
  useCreateFeeItemMutation,
  useListFeeStructureQuery,
  useSetFeeStructureItemMutation,
  useCopyFeeStructureMutation,
  useGenerateInvoicesMutation,
  useGetStudentLedgerQuery,
  useRecordPaymentMutation,
  useReversePaymentMutation,
  useListDebtorsQuery,
} = feesApi;
