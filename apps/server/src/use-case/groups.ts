import { getAllGroups } from "@/data-access/groups";

export const getAllGroupsUseCase = async () => {
  const groups = await getAllGroups();
  return groups;
};
