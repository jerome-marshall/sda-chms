import { defineHandler } from "void/handler";

import { getAllGroups } from "../../../../server/effect/groups";
import { runApi } from "../../../../server/effect/runtime";

export const GET = defineHandler(() => runApi(getAllGroups));
