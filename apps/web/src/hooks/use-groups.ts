import { useQuery } from "@tanstack/react-query";
import { apiClient, fetchApi, queryKeys } from "@/lib/api";

export const useGroups = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.groups(),
    queryFn: () => fetchApi(apiClient.groups.$get()),
  });

  return { data, isLoading, error };
};
