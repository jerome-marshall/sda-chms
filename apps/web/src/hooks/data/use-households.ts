import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@/lib/query";

/** Fetches all households (used for the household selector on the add-person form). */
export const useHouseholds = () => {
  const { data, isLoading, error } = useQuery(queryOptions.households());

  return { data, isLoading, error };
};
