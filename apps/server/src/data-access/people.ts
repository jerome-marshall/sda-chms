import { db } from "@sda-chms/db";

export const getAllPeople = async () => {
  const people = await db.query.people.findMany();
  return people;
};
