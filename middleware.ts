// file: middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// List rute yang hanya boleh diakses oleh ADMIN
const ADMIN_PROTECTED_PATHS = ['/admin', '/admin/master-buku', '/admin/peminjaman']

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req })

    // 1. Cek User Authentication
    // Jika tidak ada token (belum login), withAuth akan redirect ke halaman login
    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // 2. Cek Role untuk Rute Admin
    const pathname = req.nextUrl.pathname
    const isAdminRoute = ADMIN_PROTECTED_PATHS.some(path => pathname.startsWith(path))

    // Asumsikan 'role' user tersimpan di JWT token (didefinisikan di next-auth config)
    // Di sini, kita akan mengecek role: ADMIN
    if (isAdminRoute && token.role !== 'ADMIN') {
      // Jika bukan Admin, redirect ke homepage atau halaman 403 (Forbidden)
      return NextResponse.redirect(new URL('/403', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
        // Callback ini memastikan kita mendapatkan token sebelum menjalankan middleware di atas
        authorized: ({ token }) => !!token,
    },
    // Konfigurasi ini memberitahu NextAuth rute mana saja yang akan diproteksi oleh middleware
    pages: {
        signIn: '/login',
    },
  }
)

// Konfigurasi untuk memberitahu Next.js rute mana yang harus dilewati middleware
export const config = {
  matcher: [
    /*
     * Kecualikan:
     * - API routes (dibatasi oleh NextAuth itu sendiri)
     * - Static files (_next/static, assets)
     * - Public files (favicon.ico)
     * - Halaman otentikasi (login, verify, error)
     */
    '/((?!api|_next/static|_next/image|assets|favicon.ico|login|verify|error).*)',
  ],
}