import { baseApi } from "@/store/api/base-api";

export type NigerianState = { state: string; lgas: string[] };

// Reference lists change only with a deploy. Keep them cached for the whole
// visit instead of RTK Query's default minute, so a secretary registering
// thirty students downloads the 774 LGAs once.
const FOR_THE_VISIT = 60 * 60 * 12;

export const referenceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStates: builder.query<NigerianState[], void>({
      query: () => ({ url: "/reference/states" }),
      keepUnusedDataFor: FOR_THE_VISIT,
    }),

    getBloodGroups: builder.query<string[], void>({
      query: () => ({ url: "/reference/blood-groups" }),
      keepUnusedDataFor: FOR_THE_VISIT,
    }),
  }),
});

export const { useGetStatesQuery, useGetBloodGroupsQuery } = referenceApi;
