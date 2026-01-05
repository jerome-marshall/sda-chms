import type { PersonInsertForm } from "@sda-chms/shared/schema/people";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, fetchApi, queryKeys } from "@/lib/api";

export const usePeople = () => {
  const query = useQuery({
    queryKey: queryKeys.people(),
    queryFn: () => fetchApi(apiClient.people.$get()),
  });

  return query;
};

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
