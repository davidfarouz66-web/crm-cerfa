import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const isLocal = (process.env.DATABASE_URL ?? "").includes("localhost") || (process.env.DATABASE_URL ?? "").includes("127.0.0.1");
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL!,
            ssl: isLocal ? false : { rejectUnauthorized: false },
          });

          const result = await pool.query(
            'SELECT id, email, name, role, status, password, "tenantId" FROM "User" WHERE email = $1',
            [credentials.email]
          );
          await pool.end();

          const user = result.rows[0];
          console.log("[auth] user found:", !!user, "email:", credentials.email);
          if (!user) return null;

          const valid = await bcrypt.compare(credentials.password, user.password);
          console.log("[auth] password valid:", valid);
          if (!valid) return null;

          if (user.status === "pending") throw new Error("PENDING");
          if (user.status === "suspended") throw new Error("SUSPENDED");

          return { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId };
        } catch (err) {
          console.error("[auth] error:", String(err));
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role     = (user as { role?: string }).role;
        token.id       = user.id;
        token.tenantId = (user as { tenantId?: string }).tenantId ?? "default";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string; id?: string; tenantId?: string }).role     = token.role as string;
        (session.user as { role?: string; id?: string; tenantId?: string }).id       = token.id as string;
        (session.user as { role?: string; id?: string; tenantId?: string }).tenantId = token.tenantId as string;
      }
      return session;
    },
  },
};
