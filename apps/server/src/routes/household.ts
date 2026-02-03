import { Hono } from "hono";
import { getAllHouseholdUseCase } from "../use-case/people";

const app = new Hono().get("/", async (c) => {
  const households = await getAllHouseholdUseCase();
  return c.json(households, 200);
});

export default app;
