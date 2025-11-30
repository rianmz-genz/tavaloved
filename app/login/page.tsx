"use client"

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Image from 'next/image' // Import komponen Image dari Next.js

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'

// Asumsikan path gambar sudah benar
const LOGO_PATH = "/assets/img/tavaloved.webp"


export default function LoginPage() {
  const [email, setEmail] = useState("misal@mail.com") // Pre-fill untuk testing
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Menggunakan signIn NextAuth dengan 'email' provider
    try {
      const result = await signIn('email', { 
        email: email, 
        redirect: false, // Jangan redirect otomatis, kita handle di sini
        callbackUrl: '/' 
      })

      if (result?.error) {
        setError("Gagal mengirim Magic Link. Pastikan email Anda valid.")
      } else if (result?.ok) {
        // Jika Magic Link terkirim, NextAuth biasanya akan mengarahkan ke halaman /verify-request
        // Karena kita pakai redirect: false, kita bisa beri feedback
        // Di NextAuth, result?.ok biasanya false saat email dikirim dan redirect: false
        // Tapi kita anggap sukses jika tidak ada error
        // Note: Sebenarnya, NextAuth sendiri sudah mengarahkan ke /verify-request secara internal saat sukses
        toast.success("Link masuk telah dikirim ke email Anda. Cek inbox atau folder spam.")
      }

    } catch (err) {
      console.error(err)
      setError("Terjadi kesalahan tak terduga.")
    } finally {
      setIsLoading(false)
      // Feedback tambahan:
    }
  }


  return (
    // Tambahkan bg-secondary/30 untuk sedikit tekstur background
    <div className="flex items-center justify-center min-h-screen bg-secondary/30 dark:bg-background">
      <Card className="w-[380px] shadow-2xl overflow-hidden">
        {/* HEADER dengan LOGO */}
        <CardHeader className="p-6 pb-0">
            <div className="flex justify-center mb-4">
                <Image 
                    src={LOGO_PATH} 
                    alt="Logo Perpustakaan Tavaloved"
                    width={80} // Sesuaikan ukuran
                    height={80} // Sesuaikan ukuran
                    className="rounded-full shadow-md border-2 border-primary/20"
                />
            </div>
            <CardTitle className="text-3xl text-center font-bold text-primary">
                Tavaloved
            </CardTitle>
            <CardDescription className="text-center mt-2">
                Masuk dengan <strong>Magic Link</strong> Anda.
            </CardDescription>
        </CardHeader>

        {/* CONTENT FORM */}
        <CardContent className="p-6 pt-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            
            {/* Display Error Message */}
            {error && (
                <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 px-4 focus:border-primary/50"
              />
            </div>
            
            <Button 
                type="submit" 
                className="w-full text-lg py-6 tracking-wide shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
            >
              {isLoading ? "Mengirim..." : "Kirim Link Masuk"}
            </Button>
            
            <p className="text-center text-xs text-muted-foreground mt-2">
            Otomatis daftar jika email belum terdaftar, akun akan dibuat.
            </p>

            {/* Tambahan Info */}
            <div className="text-center text-xs text-primary/70 mt-4 border-t pt-4">
                <p>Proses ini tidak membutuhkan password.</p>
                <p className="font-medium">Cek folder Spam jika tidak menerima email.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}