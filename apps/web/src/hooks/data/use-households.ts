import { useQuery } from "@tanstack/react-query";
import { apiClient, fetchApi, queryKeys } from "@/lib/api";

/** Fetches all households (used for the household selector on the add-person form). */
export const useHouseholds = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.households(),
    queryFn: () => fetchApi(apiClient.households.$get()),
  });

  return { data, isLoading, error };
};
