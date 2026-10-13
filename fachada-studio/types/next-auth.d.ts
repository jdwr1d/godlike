import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      activeWorkspaceId: string | null;
    } & DefaultSession["user"];
  }
}
