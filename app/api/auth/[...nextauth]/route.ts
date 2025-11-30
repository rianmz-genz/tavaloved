// file: app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions, type DefaultSession } from "next-auth" // Tambahkan DefaultSession
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import EmailProvider from "next-auth/providers/email"
import { PrismaClient } from "@prisma/client";

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
function html({ url, host, email }: { url: string; host: string; email: string }) {
    // Styling dasar Anda
    const brandColor = '#eb3478'; // Warna primary TAVALOVEd
    
    return `
        <div style="border: 1px solid ${brandColor}; padding: 20px; border-radius: 10px; font-family: sans-serif; max-width: 600px; margin: auto;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: ${brandColor}; margin: 0;">TAVALOVEd LIBRARY</h1>
                <p style="color: #555;">Verifikasi Email Anda</p>
            </div>
            <p style="font-size: 16px; color: #333;">Halo ${email},</p>
            <p style="font-size: 16px; color: #333;">Gunakan tombol di bawah untuk masuk secara instan ke perpustakaan Anda. Tautan ini akan kedaluwarsa setelah 24 jam.</p>
            
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding: 10px 0 20px 0;">
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="border-radius: 5px;" bgcolor="${brandColor}">
                        <a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 12px 25px; border: 1px solid ${brandColor}; display: inline-block; font-weight: bold;">
                            Masuk ke TAVALOVEd
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="font-size: 14px; color: #777;">Jika Anda tidak meminta tautan ini, Anda dapat mengabaikan email ini.</p>
            <p style="font-size: 14px; color: #777;">— Tim TAVALOVEd Library</p>
        </div>
    `;
}

// Fungsi Utama untuk Mengirim Email
// Menggunakan async/await agar bisa di-hook untuk logging (Lihat bagian 2)
async function sendVerificationRequest({ identifier: email, url, provider, baseUrl, theme }: any) {
    const { host } = new URL(url);
    console.log(`Mengirim email verifikasi ke ${email} untuk host ${host} dengan URL: ${url}`);
    // PANGGIL FUNGSI KIRIM EMAIL DARI NODE MAILER DI SINI
    // Anda harus menggunakan service email yang sudah dikonfigurasi
    // Asumsi: Anda sudah punya 'sendEmail' helper yang menggunakan 'provider.server' dan 'provider.from'
    
    // Note: Karena saya tidak punya 'sendEmail' helper Anda, saya pakai Nodemailer standar
    const transporter = (await import('nodemailer')).createTransport(provider.server);
    await transporter.sendMail({
        to: email,
        from: provider.from,
        subject: `[TAVALOVEd] Tautan Masuk untuk ${host}`,
        html: html({ url, host, email }),
        // text: text({ url, host }) // Tambahkan versi teks jika perlu
    });
}
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma as unknown as PrismaClient),

    providers: [
        EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
            sendVerificationRequest
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

}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }