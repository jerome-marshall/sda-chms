import { defineHandler } from "void/handler";

import { getAllGroupsUseCase } from "../../../server/use-case/groups";

export const GET = defineHandler(() => getAllGroupsUseCase());
