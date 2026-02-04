import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing Credentials");
        }
        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });
          if (!user || !user.password) {
            return null;
          }
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isPasswordValid) {
            throw new Error("Wrong email or password");
          }
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            image: user.image || null,
          };
        } catch (error) {
          console.error("Auth error", error);
          throw error;
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "google") {
        return true;
      }
      return true;
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: {
              email: token.email,
            },
          });

          if (dbUser) {
            token.id = dbUser.id.toString();
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.picture = dbUser.image;
          }
        } catch (error) {
          console.error("JWT callback error:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; name?: string; email?: string; image?: string }).id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};