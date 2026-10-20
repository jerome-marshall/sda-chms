import { defineHandler } from "void/handler";

import { getAllHouseholdUseCase } from "../../../server/use-case/people";

export const GET = defineHandler(() => getAllHouseholdUseCase());
