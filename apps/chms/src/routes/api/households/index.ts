import { defineHandler } from "void/handler";

import { getAllHouseholds } from "../../../../server/households";

export const GET = defineHandler(() => getAllHouseholds());
