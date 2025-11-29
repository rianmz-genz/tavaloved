// file: app/api/dashboard/return/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
// Asumsi 'authOptions' adalah export dari [...nextauth]/route
// (Jika Anda tidak mengimpor 'authOptions', gunakan saja getServerSession() tanpa argumen, atau pastikan import authOptions di atas sudah benar)
import { authOptions } from '../../auth/[...nextauth]/route'; 

export async function POST(req: NextRequest) {
    // Menggunakan authOptions jika Anda mengaturnya di NextAuth 
    // Jika tidak, gunakan: const session = await getServerSession();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    const { loanId, rating, reviewText } = await req.json();
    
    if (!loanId) {
        return new NextResponse('Missing loan ID.', { status: 400 });
    }

    try {
        // --- TRANSAKSI DATABASE ---
        const result = await prisma.$transaction(async (tx) => {
            
            // 1. Ambil Pinjaman
            const loan = await tx.loan.findUnique({
                where: { id: loanId, userId: userId },
                select: { 
                    status: true, 
                    itemId: true, 
                    item: { select: { titleId: true } }
                }
            });

            if (!loan) { throw new Error('Pinjaman tidak ditemukan atau bukan milik Anda.'); }
            if (loan.status !== 'APPROVED') { throw new Error(`Buku belum dipinjam atau statusnya ${loan.status}.`); }
            
            const titleId = loan.item.titleId; // ID Buku yang di-review

            // 2. Tandai Loan sebagai RETURNED
            await tx.loan.update({
                where: { id: loanId },
                data: { 
                    status: 'RETURNED', 
                    returnDate: new Date() 
                }
            });

            // 3. Update BookItem status menjadi AVAILABLE
            await tx.bookItem.update({
                where: { id: loan.itemId },
                data: { status: 'AVAILABLE' }
            });

            // 4. Jika ada rating/review, buat record Review baru
            let reviewRecord = null;
            if (rating && reviewText) {
                // Pastikan rating adalah integer
                const parsedRating = parseInt(rating); 
                
                reviewRecord = await tx.review.create({
                    data: {
                        userId: userId,
                        titleId: titleId,
                        rating: parsedRating,
                        text: reviewText,
                    }
                });
                
                // 5. Update totalBooksFinished pada User
                await tx.user.update({
                    where: { id: userId },
                    data: { totalBooksFinished: { increment: 1 } }
                });

                // 6. PERBAIKAN: Hitung dan Update avgRating di BookTitle
                
                // Hitung rata-rata rating baru untuk buku ini
                const aggregation = await tx.review.aggregate({
                    _avg: {
                        rating: true,
                    },
                    where: {
                        titleId: titleId,
                    },
                });

                const newAvgRating = aggregation._avg.rating || 0; // Gunakan 0 jika tidak ada rating
                
                // Update BookTitle dengan rata-rata baru
                await tx.bookTitle.update({
                    where: { id: titleId },
                    data: {
                        avgRating: newAvgRating,
                    },
                });
            }

            return { loan, reviewRecord };
        });
        // --- AKHIR TRANSAKSI DATABASE ---

        return NextResponse.json({ 
            message: 'Book successfully returned.',
            reviewCreated: !!result.reviewRecord,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error processing return/review:', error);
        
        let errorMessage = error.message;
        if (error.code === 'P2002') {
             errorMessage = 'Anda sudah memberikan ulasan untuk buku ini.';
        }
        
        return new NextResponse(errorMessage, { status: 400 });
    }
}