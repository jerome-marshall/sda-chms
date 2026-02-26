import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@/lib/query";

/** Fetches all church groups. */
export const useGroups = () => {
  const { data, isLoading, error } = useQuery(queryOptions.groups());

  return { data, isLoading, error };
};
