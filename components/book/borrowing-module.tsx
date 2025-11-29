// file: components/book/borrowing-module.tsx
"use client";

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { LogIn, BookCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface BookTitleInfo {
    id: string;
    title: string;
}

interface BorrowingModuleProps {
    book: BookTitleInfo;
}

// --- FUNGSI PINJAM (REAL API CALL) ---
const submitLoanRequest = async (bookId: string, userId: string, quantity: number, returnDate: string) => {
    const response = await fetch('/api/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, userId, quantity, returnDate }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Gagal mengajukan pinjaman.");
    }

    return response.json();
};


export function BorrowingModule({ book }: BorrowingModuleProps) {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const [isLoading, setIsLoading] = useState(false);
    
    // Pastikan tanggal default hari ini + 7 hari
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    
    const [loanData, setLoanData] = useState({
        quantity: 1,
        returnDate: tomorrow.toISOString().substring(0, 10), 
        selectedItemId: '' 
    });

    const handleBorrow = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id) {
            toast.error("Error", { description: "ID pengguna tidak ditemukan. Silakan login ulang." });
            return;
        }

        setIsLoading(true);
        const loadingToastId = toast.loading(`Mengirim permintaan pinjaman untuk ${book.title}...`);

        try {
            const result = await submitLoanRequest(
                book.id,
                session.user.id!, // ID sudah dipastikan ada
                loanData.quantity,
                loanData.returnDate
            );

            toast.success("Permintaan Pinjaman Terkirim!", {
                description: `Permintaan pinjaman Anda (ID: ${result.loanId}) untuk buku "${book.title}" telah diajukan. Admin akan segera memproses.`,
                id: loadingToastId,
            });

        } catch (error: any) {
            toast.error("Gagal Mengajukan Pinjaman", {
                description: error.message,
                id: loadingToastId,
            });
        } finally {
            setIsLoading(false);
            setTimeout(() => toast.dismiss(loadingToastId), 3000);
        }
    };

    // --- Tampilan 1: Belum Login (Tetap Sama) ---
    if (status === 'unauthenticated') {
        return (
            <Card className="mt-8 bg-secondary/50 dark:bg-zinc-800">
                <CardHeader>
                    <CardTitle className="text-xl text-primary">Pinjam Buku Ini</CardTitle>
                    <CardDescription>
                        Anda harus login untuk mengajukan permintaan peminjaman.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={() => signIn('email')} 
                        className="w-full text-lg py-6"
                    >
                        <LogIn className="w-5 h-5 mr-2" /> Masuk untuk Pinjam
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // --- Tampilan 2: Sudah Login (Form Peminjaman) ---
    return (
        <Card className="mt-8 bg-card shadow-lg border border-primary/20">
            <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center">
                    <BookCheck className="w-5 h-5 mr-2" /> Ajukan Pinjaman
                </CardTitle>
                <CardDescription>
                    Anda masuk sebagai {session?.user?.name || session?.user?.email}. Isi detail pinjaman di bawah.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleBorrow} className="grid gap-4">
                    
                    {/* Input Jumlah Pinjam (Dibatasi 1) */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Jumlah Copy (Saat ini dibatasi 1)</Label>
                            <Input 
                                id="quantity" 
                                type="number" 
                                min="1" 
                                max="1" 
                                value={loanData.quantity}
                                onChange={(e) => setLoanData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                required 
                                disabled // Disable karena dibatasi 1
                            />
                        </div>

                        {/* Input Tanggal Kembali */}
                        <div className="space-y-2">
                            <Label htmlFor="returnDate">Tanggal Pengembalian</Label>
                            <Input 
                                id="returnDate" 
                                type="date" 
                                // Pastikan minimum adalah besok
                                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10)} 
                                value={loanData.returnDate}
                                onChange={(e) => setLoanData(prev => ({ ...prev, returnDate: e.target.value }))}
                                required 
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full text-lg" disabled={isLoading || status !== 'authenticated'}>
                        {isLoading ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Mengajukan...</>
                        ) : (
                            "Kirim Permintaan Pinjaman"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}