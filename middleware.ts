// file: middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// List rute yang hanya boleh diakses oleh ADMIN dan DASHBOARD
const ADMIN_PROTECTED_PATHS = ['/admin'] 

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req })

    // 1. Logika untuk redirect ke /login jika tidak ada token
    if (!token) {
        // Logika ini hanya akan dijalankan pada rute yang di-match oleh 'config.matcher'
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // 2. Cek Role untuk Rute Admin
    const pathname = req.nextUrl.pathname
    const isAdminRoute = ADMIN_PROTECTED_PATHS.some(path => pathname.startsWith(path))

    if (isAdminRoute && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/403', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
        authorized: ({ token }) => !!token,
    },
    pages: {
        signIn: '/login',
    },
  }
)

// Konfigurasi untuk memberitahu Next.js rute mana yang harus dilewati middleware
export const config = {
  matcher: [
    /*
     * PROTEKSI: /admin, /dashboard, dll.
     * KECUALIKAN:
     * - / (Root/Landing Page)
     * - /login, /verify, /error
     * - /user/* (Share Profile)
     * - /book/* (Detail Buku Public)
     * - /uploads/* (Aset Publik seperti Gambar Cover/Avatar) <--- TAMBAHKAN INI
     */
    '/((?!api|_next/static|_next/image|assets|favicon.ico|login|verify|error|user|book|uploads|$).*)',
    // Pola: (?!...) akan mengecualikan semua yang ada di dalam kurung.
    // Pastikan Anda juga memasukkan rute yang perlu diproteksi di matcher ini, 
    // seperti /dashboard jika Anda ingin dashboard terproteksi.
  ],
}