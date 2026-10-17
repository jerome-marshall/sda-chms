import {
  QueryClient,
  queryOptions as tsQueryOptions,
} from "@tanstack/react-query";
import { fetch } from "void/client";

import { fetchApi } from "./api";

export const queryClient = new QueryClient();

/** Centralized TanStack Query key factory — keeps cache invalidation consistent. */
export const queryKeys = {
  people: () => ["people"],
  person: (id: string) => ["people", id],
  groups: () => ["groups"],
  households: () => ["households"],
  relationships: (personId: string) => ["relationships", personId],
};

/** Pre-built query option objects for use in loaders and hooks — ensures key/fetcher consistency. */
export const queryOptions = {
  people: () =>
    tsQueryOptions({
      queryKey: queryKeys.people(),
      queryFn: () => fetchApi(fetch("/api/people", { retry: 0 })),
    }),
  person: (id: string) =>
    tsQueryOptions({
      queryKey: queryKeys.person(id),
      queryFn: () =>
        fetchApi(fetch("/api/people/:id", { params: { id }, retry: 0 })),
    }),
  groups: () =>
    tsQueryOptions({
      queryKey: queryKeys.groups(),
      queryFn: () => fetchApi(fetch("/api/groups", { retry: 0 })),
    }),
  households: () =>
    tsQueryOptions({
      queryKey: queryKeys.households(),
      queryFn: () => fetchApi(fetch("/api/households", { retry: 0 })),
    }),
  relationships: (personId: string) =>
    tsQueryOptions({
      queryKey: queryKeys.relationships(personId),
      queryFn: () =>
        fetchApi(
          fetch("/api/relationships/person/:personId", {
            params: { personId },
            retry: 0,
          })
        ),
    }),
};
