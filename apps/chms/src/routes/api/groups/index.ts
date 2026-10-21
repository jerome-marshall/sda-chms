import { defineHandler } from "void/handler";

import { getAllGroups } from "../../../../server/groups";

export const GET = defineHandler(() => getAllGroups());
