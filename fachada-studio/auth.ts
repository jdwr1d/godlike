import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { render } from "@react-email/components";
import { Resend as ResendClient } from "resend";
import { ObjectId } from "mongodb";
import { getClient, getDb } from "@/lib/db/mongo";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createPersonalWorkspace } from "@/lib/workspaces";
import { MagicLinkEmail, magicLinkText } from "@/emails/magic-link";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? "Fachada";

// Lazy config so `next build` works without MONGODB_URI.
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: MongoDBAdapter(getClient()),
  session: { strategy: "database" },
  pages: { signIn: "/login", verifyRequest: "/login/check-email", error: "/login/error" },
  providers: [
    Resend({
      apiKey: env.AUTH_RESEND_KEY,
      from: env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url }) {
        if (!env.AUTH_RESEND_KEY || !env.EMAIL_FROM) throw new Error("Resend is not configured");
        if (!(await rateLimit(`magic:${email.toLowerCase()}`, 5, 3600))) throw new Error("Too many requests");
        const resend = new ResendClient(env.AUTH_RESEND_KEY);
        const { error } = await resend.emails.send({
          from: env.EMAIL_FROM,
          to: email,
          subject: `Entrar a ${BRAND} · Sign in to ${BRAND}`,
          html: await render(MagicLinkEmail({ url, brand: BRAND })),
          text: magicLinkText(url, BRAND),
        });
        if (error) throw new Error(`Resend error: ${error.message}`);
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      const db = await getDb();
      const u = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
      session.user.id = user.id;
      session.user.role = u?.role === "admin" ? "admin" : "user";
      session.user.activeWorkspaceId = u?.lastWorkspaceId?.toString() ?? null;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const db = await getDb();
      await db.collection("users").updateOne({ _id: new ObjectId(user.id) }, { $set: { role: "user", locale: "es" } });
      await createPersonalWorkspace(user.id);
    },
  },
}));
