// file: app/api/auth/[...nextauth]/route.ts

import NextAuth, { type DefaultSession } from "next-auth" // Tambahkan DefaultSession
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import EmailProvider from "next-auth/providers/email"
import { PrismaClient } from "@prisma/client"

// -------------------------------------------------------------
// Tambahkan deklarasi module untuk memperluas tipe Session dan JWT
// agar 'role' dikenal oleh TypeScript.
// -------------------------------------------------------------
declare module "next-auth" {
    interface Session {
        user: {
            id: string; // Tambahkan id
            role: string; // Tambahkan role
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string;
        id?: string;
    }
}

const handler = NextAuth({
    adapter: PrismaAdapter(prisma as PrismaClient),

    providers: [
        EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
        }),
    ],

    session: {
        strategy: "jwt",
    },

    // -------------------------------------------------------------
    // Tambahkan Callbacks untuk memasukkan Role ke dalam Session/Token
    // -------------------------------------------------------------
    callbacks: {
        // Callback untuk JWT: Memasukkan data user ke token
        async jwt({ token, user, trigger, session }) {
            // Saat user login (user ada)
            if (user) {
                // Ambil data User lengkap dari DB jika perlu
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email! },
                    select: { id: true, role: true }
                });

                token.id = dbUser?.id;
                token.role = dbUser?.role;
            }
            return token;
        },

        // Callback untuk Session: Memasukkan data dari token ke session
        async session({ session, token }) {
            if (token) {
                console.log(token)
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return { ...session, ...token };
        },
    },

    pages: {
        signIn: '/login',
        verifyRequest: '/login/verify',
        error: '/login/error',
    },

})

export { handler as GET, handler as POST }