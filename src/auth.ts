import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";

export const {
  auth,
  handlers: { GET, POST },
} = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const client = await db.connect();
        try {
          const { rows } = await client.query(
            `SELECT u.id, u.email, u.username, uc.password_hash
             FROM users u
             JOIN user_credentials uc ON uc.user_id = u.id
             WHERE u.email = $1`,
            [credentials.email],
          );
          const user = rows[0];
          if (!user?.password_hash) return null;
          const match = await bcrypt.compare(
            credentials.password as string,
            user.password_hash,
          );
          if (!match) return null;
          return { id: user.id, email: user.email, name: user.username };
        } finally {
          client.release();
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as any).id = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      if ((token as any)?.id && session.user) {
        (session.user as any).id = (token as any).id;
      }
      return session;
    },
  },
});

