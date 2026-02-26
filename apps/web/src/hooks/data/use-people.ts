import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, fetchApi } from "@/lib/api";
import { queryKeys, queryOptions } from "@/lib/query";

/** Fetches the full people list with household head fallback data. */
export const usePeople = () => {
  const query = useQuery(queryOptions.people());

  return query;
};

/** Mutation hook for creating a new person — invalidates the people list on success. */
export const useAddPerson = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: PersonInsertForm) =>
      fetchApi(apiClient.people.$post({ json: data })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people() });
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return mutation;
};
