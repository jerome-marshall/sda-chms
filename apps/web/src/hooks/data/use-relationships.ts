import type { RelationshipCreate } from "@sda-chms/shared/schema/people";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, fetchApi } from "@/lib/api";
import { queryKeys, queryOptions } from "@/lib/query";

/** Fetches a person's relationships, resolved from that person's perspective. */
export const useRelationships = (personId: string) =>
  useQuery(queryOptions.relationships(personId));

/**
 * Mutation hook for linking two people — invalidates the relationship lists of
 * both sides so the reciprocal link shows up immediately on either detail page.
 */
export const useAddRelationship = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
} = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RelationshipCreate) =>
      fetchApi(apiClient.relationships.$post({ json: data })),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.relationships(variables.personId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.relationships(variables.relatedPersonId),
      });
      onSuccess?.();
    },
    onError: (error) => onError?.(error),
  });
};

/** Mutation hook for removing a relationship; invalidates the current person's list. */
export const useRemoveRelationship = ({
  personId,
  onSuccess,
  onError,
}: {
  personId: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi(apiClient.relationships[":id"].$delete({ param: { id } })),
    onSuccess: () => {
      // The reciprocal side is unknown here, so refetch all relationship lists.
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.relationships(personId),
      });
      onSuccess?.();
    },
    onError: (error) => onError?.(error),
  });
};
