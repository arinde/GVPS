import { baseApi } from "@/store/api/base-api";

export type EmailTrailStatus = "sent" | "failed" | "skipped";
export type EmailTrailItem = {
  id: string;
  createdAt: string;
  status: EmailTrailStatus;
  recipient: string;
  subject: string;
  reason: string | null;
  relatedTo: string;
  sentBy: string | null;
};
export type EmailTrailPage = { items: EmailTrailItem[]; total: number; page: number; pageSize: number };

/** FEATURES.md §11.5 — the audit log, filtered to email. Proprietor and principal only. */
export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listEmailTrail: builder.query<EmailTrailPage, { page: number; pageSize: number }>({
      query: ({ page, pageSize }) => ({ url: "/audit/emails", params: { page, pageSize } }),
    }),
  }),
});

export const { useListEmailTrailQuery } = auditApi;
