// file: app/admin/master-buku/page.tsx
"use client"

import { useState } from 'react'
import { BookForm } from "@/components/admin/book-form"
import { BookTable } from "@/components/admin/book-table"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function MasterBukuPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [showForm, setShowForm] = useState(false); // State untuk toggle form

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1); 
        setShowForm(false); // Sembunyikan form setelah sukses
    };

    return (
        <div>
            <h1 className="text-4xl font-medium text-foreground mb-1">📚 Master Buku</h1>
            <p className="text-muted-foreground mb-6">Kelola katalog judul dan stok fisik buku perpustakaan.</p>

            <div className="mb-8 flex justify-between items-center">
                <h2 className="text-3xl font-medium text-foreground">Daftar Katalog</h2>
                {/* Tombol Toggle Form */}
                <Button 
                    onClick={() => setShowForm(prev => !prev)} 
                    variant={showForm ? "secondary" : "default"}
                    className="space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>{showForm ? "Tutup Form" : "Tambah Baru"}</span>
                </Button>
            </div>

            {/* Area Form Input (Muncul saat showForm TRUE) */}
            {showForm && (
                <div className="max-w-2xl mx-auto mb-10">
                    <BookForm onSuccess={handleSuccess} />
                </div>
            )}

            {/* Separator hanya muncul jika form disembunyikan */}
            {!showForm && <Separator className="my-8" />} 

            {/* Area Tabel (Selalu Tampil) */}
            <BookTable refreshKey={refreshKey} />
        </div>
    );
}