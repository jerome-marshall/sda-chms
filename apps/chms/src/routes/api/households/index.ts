import { defineHandler } from "void/handler";

import { getAllHouseholds } from "../../../../server/effect/households";
import { runApi } from "../../../../server/effect/runtime";

export const GET = defineHandler(() => runApi(getAllHouseholds));
