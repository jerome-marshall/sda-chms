import { useQuery } from "@tanstack/react-query";
import { apiClient, fetchApi, queryKeys } from "@/lib/api";

export const useHouseholds = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.households(),
    queryFn: () => fetchApi(apiClient.households.$get()),
  });

  return { data, isLoading, error };
};
