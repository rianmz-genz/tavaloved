// file: app/admin/page.tsx

import { Card, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-foreground mb-1">
        👋 Selamat Datang, Admin!
      </h1>
      <p className="text-muted-foreground mb-6">
        Ini adalah ringkasan aktivitas perpustakaan Anda.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5">
          <CardTitle className="text-xl text-primary">Total Judul</CardTitle>
          <p className="text-4xl font-bold mt-2">108</p>
        </Card>
        <Card className="p-5">
          <CardTitle className="text-xl text-primary">Buku Dipinjam</CardTitle>
          <p className="text-4xl font-bold mt-2">12</p>
        </Card>
        <Card className="p-5">
          <CardTitle className="text-xl text-primary">Anggota Aktif</CardTitle>
          <p className="text-4xl font-bold mt-2">55</p>
        </Card>
      </div>

      <Separator className="my-8" />

      <Card className="p-6">
        <CardTitle className="text-2xl">Aktivitas Terbaru</CardTitle>
        <p className="text-muted-foreground mt-4">
          Tampilkan log peminjaman, pengembalian, dan kontribusi terbaru di
          sini.
        </p>
      </Card>
    </div>
  );
}
