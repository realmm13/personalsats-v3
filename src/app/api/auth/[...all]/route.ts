import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth"; // path to your auth file

if (!auth || typeof auth !== "object") {
  throw new Error("Missing or malformed 'auth' object at build time!");
}

export const { POST, GET } = toNextJsHandler(auth);
