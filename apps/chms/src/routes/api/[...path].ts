import type { ApiErrorBody } from "@sda-chms/shared/types/errors";
import { defineHandler } from "void/handler";

const notFound: ApiErrorBody = { code: "HTTP_ERROR", message: "Not found" };

export const GET = defineHandler((c) => c.json(notFound, 404));
export const POST = defineHandler((c) => c.json(notFound, 404));
export const PUT = defineHandler((c) => c.json(notFound, 404));
export const PATCH = defineHandler((c) => c.json(notFound, 404));
export const DELETE = defineHandler((c) => c.json(notFound, 404));
