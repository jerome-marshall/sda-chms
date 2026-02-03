import type { FileRoutesByTo, FileRouteTypes } from "@/routeTree.gen";

export type TRoutes = keyof FileRoutesByTo;
export type TRouteId = FileRouteTypes["id"];
