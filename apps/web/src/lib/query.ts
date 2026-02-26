import {
  QueryClient,
  queryOptions as tsQueryOptions,
} from "@tanstack/react-query";
import { apiClient, fetchApi } from "./api";

export const queryClient = new QueryClient();

/** Centralized TanStack Query key factory — keeps cache invalidation consistent. */
export const queryKeys = {
  people: () => ["people"],
  person: (id: string) => ["people", id],
  groups: () => ["groups"],
  households: () => ["households"],
};

export const queryOptions = {
  people: () =>
    tsQueryOptions({
      queryKey: queryKeys.people(),
      queryFn: () => fetchApi(apiClient.people.$get()),
    }),
  groups: () =>
    tsQueryOptions({
      queryKey: queryKeys.groups(),
      queryFn: () => fetchApi(apiClient.groups.$get()),
    }),
  households: () =>
    tsQueryOptions({
      queryKey: queryKeys.households(),
      queryFn: () => fetchApi(apiClient.households.$get()),
    }),
};
