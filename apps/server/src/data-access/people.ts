import { db } from "@sda-chms/db";

export const getAllPeople = async () => {
  const people = await db.query.peopleTable.findMany();
  return people;
};
