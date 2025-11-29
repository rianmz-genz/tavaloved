// file: app/api/admin/loans/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const loanId = (await params).id;
    const session = await getServerSession(authOptions);

    // Proteksi: Hanya Admin yang bisa melakukan aksi ini
    if (!session || session.user.role !== 'ADMIN') {
        return new NextResponse('Forbidden: Admin access required', { status: 403 });
    }

    const { action } = await req.json(); // action: 'APPROVE' atau 'REJECT'

    if (action !== 'APPROVE' && action !== 'REJECT') {
        return new NextResponse('Invalid action specified.', { status: 400 });
    }

    try {
        // --- TRANSAKSI DATABASE ---
        const updatedLoan = await prisma.$transaction(async (tx) => {

            // 1. Ambil data pinjaman dan pastikan statusnya REQUESTED
            const loan = await tx.loan.findUnique({
                where: { id: loanId },
                select: {
                    id: true,
                    status: true,
                    itemId: true,
                    user: { select: { email: true } },
                    item: { select: { title: { select: { title: true } } } }
                }
            });

            if (!loan) { throw new Error('Pinjaman tidak ditemukan.'); }
            if (loan.status !== 'REQUESTED') { throw new Error(`Aksi tidak valid. Status pinjaman saat ini: ${loan.status}`); }


            // 2. Tentukan status baru
            const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

            // 3. Update status pinjaman
            await tx.loan.update({
                where: { id: loanId },
                data: { status: newStatus }
            });

            // 4. Update status BookItem HANYA JIKA DITOLAK
            // Jika diterima, item sudah ON_LOAN saat request dibuat (di API /api/loan)
            if (action === 'REJECT') {
                await tx.bookItem.update({
                    where: { id: loan.itemId },
                    data: { status: 'AVAILABLE' } // Kembalikan status item menjadi tersedia
                });
            }

            return { loan, newStatus };
        });
        // --- AKHIR TRANSAKSI DATABASE ---

        // (Opsional) TODO: KIRIM EMAIL NOTIFIKASI KE USER (ACCEPTED/REJECTED)

        return NextResponse.json({
            message: `Loan successfully ${updatedLoan.newStatus}.`,
            loanId: updatedLoan.loan.id,
            newStatus: updatedLoan.newStatus,
        });

    } catch (error: any) {
        console.error('Error processing loan action:', error);
        return new NextResponse(error.message || 'Internal server error.', { status: 500 });
    }
}