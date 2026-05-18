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

          const pool = new Pool({
            connectionString: process.env.DATABASE_URL!,
            ssl: { rejectUnauthorized: false },
          });

          const result = await pool.query(
            'SELECT id, email, name, role, password FROM "User" WHERE email = $1',
            [credentials.email]
          );
          await pool.end();

          const user = result.rows[0];
          console.log("[auth] user found:", !!user, "email:", credentials.email);
          if (!user) return null;

          const valid = await bcrypt.compare(credentials.password, user.password);
          console.log("[auth] password valid:", valid);
          if (!valid) return null;

          return { id: user.id, email: user.email, name: user.name, role: user.role };
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
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string; id?: string }).role = token.role as string;
        (session.user as { role?: string; id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};
