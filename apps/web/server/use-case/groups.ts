import { getAllGroups } from "../data-access/groups";

/** Returns all church groups. */
export const getAllGroupsUseCase = async () => {
  const groups = await getAllGroups();
  return groups;
};
