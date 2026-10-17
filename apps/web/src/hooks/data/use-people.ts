import type {
  PersonInsertForm,
  PersonUpdateForm,
} from "@sda-chms/shared/schema/people";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetch } from "void/client";

import { fetchApi } from "@/lib/api";
import { queryKeys, queryOptions } from "@/lib/query";
import type { PersonCreated, PersonDetail } from "@/types/api";

/** Fetches the full people list with household head fallback data. */
export const usePeople = () => useQuery(queryOptions.people());

/** Mutation hook for creating a new person — invalidates the people list on success. */
export const useAddPerson = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (person: PersonCreated) => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PersonInsertForm) =>
      fetchApi(fetch("/api/people", { method: "POST", body: data, retry: 0 })),
    onSuccess: (person) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.people() });
      onSuccess?.(person);
    },
    onError: (error) => {
      onError?.(error);
    },
  });
};

/** Mutation hook for updating an existing person — invalidates both list and detail caches on success. */
export const useUpdatePerson = ({
  personId,
  onSuccess,
  onError,
}: {
  personId: string;
  onSuccess?: (person: PersonDetail) => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PersonUpdateForm) =>
      fetchApi(
        fetch("/api/people/:id", {
          method: "PUT",
          params: { id: personId },
          body: data,
          retry: 0,
        })
      ),
    onSuccess: (person) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.people() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.person(personId),
      });
      onSuccess?.(person);
    },
    onError: (error) => {
      onError?.(error);
    },
  });
};
