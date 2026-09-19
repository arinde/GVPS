import { baseApi } from "@/store/api/base-api";

export type EnquiryStatus = "NEW" | "CONTACTED" | "CLOSED";

export type EnquiryRequest = {
  parentName: string;
  phone: string;
  email?: string;
  childName?: string;
  interest: string;
  message?: string;
  /** Hidden from people; anything typed here marks the sender as a bot. */
  website?: string;
};

export type Enquiry = Omit<EnquiryRequest, "website" | "email" | "childName" | "message"> & {
  id: string;
  email: string | null;
  childName: string | null;
  message: string | null;
  status: EnquiryStatus;
  officeNote: string | null;
  handledAt: string | null;
  createdAt: string;
};

/**
 * Admission enquiries: the landing page sends them without signing in; the
 * office lists and follows them up. The options come from the API so the
 * form offers exactly what the server accepts.
 */
export const enquiriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnquiryOptions: builder.query<{ interests: string[] }, void>({
      query: () => ({ url: "/public/enquiries/options" }),
    }),
    submitEnquiry: builder.mutation<{ received: boolean }, EnquiryRequest>({
      query: (body) => ({ url: "/public/enquiries", method: "POST", body }),
    }),
    listEnquiries: builder.query<Enquiry[], EnquiryStatus | "">({
      query: (status) => ({ url: "/enquiries", params: status ? { status } : {} }),
      providesTags: ["Enquiry"],
    }),
    updateEnquiry: builder.mutation<Enquiry, { id: string; status: EnquiryStatus; officeNote?: string }>({
      query: ({ id, ...body }) => ({ url: `/enquiries/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Enquiry", "Dashboard"],
    }),
  }),
});

export const { useGetEnquiryOptionsQuery, useSubmitEnquiryMutation, useListEnquiriesQuery, useUpdateEnquiryMutation } =
  enquiriesApi;
