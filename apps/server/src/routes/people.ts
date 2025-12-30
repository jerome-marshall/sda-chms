import { Hono } from "hono";
import { getAllPeople } from "@/data-access/people";

const app = new Hono();

app.get("/", async (c) => {
  const people = await getAllPeople();
  return c.json(people);
});

app.post("/", (c) => {
  return c.json("create a person", 201);
});

export default app;
