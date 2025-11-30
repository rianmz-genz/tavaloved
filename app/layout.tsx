import type { Metadata } from "next";
import { Fredoka, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import PublicNavbar from "@/components/layouts/public-navbar";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tavaloved Library",
  description: "Tavaloved Library - Perpustakaan Digital Favoritmu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${fredoka.className} antialiased`}>
        <Providers>
          {/* Navbar di atas main content */}
          <PublicNavbar />

          {/* Main Content */}
          {children}

          {/* Footer (Jika kamu ingin footer tetap di bawah) */}
          {/* Jika halaman public sudah ada footer, hapus footer di sini */}
        </Providers>
      </body>
    </html>
  );
}
