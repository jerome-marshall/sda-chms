import { env } from "@sda-chms/env/web";
import { hcWithType } from "@sda-chms/server/client";

export const apiClient = hcWithType(env.VITE_API_URL);
