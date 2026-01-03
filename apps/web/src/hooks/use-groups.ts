import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/hono";

export const useGroups = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["groups"],
    queryFn: () => apiClient.groups.$get().then((res) => res.json()),
  });
};
