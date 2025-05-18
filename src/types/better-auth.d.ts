import "@/server/auth";

declare module "@/server/auth" {
  interface AuthUserType {
    role: "admin" | "user" | "manager";
  }
} 