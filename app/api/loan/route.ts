// file: app/api/loan/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { sendEmail } from '@/lib/mail'; // Import service email
import { authOptions } from '../auth/[...nextauth]/route';
// --- EMAIL TUJUAN ADMIN ---
const ADMIN_EMAIL = 'work.adrianaji@gmail.com';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    console.log(session)
    // Pastikan user sudah login
    if (!session || !session.user || !session.user.id) {
        return new NextResponse('Unauthorized or user ID missing.', { status: 403 });
    }

    const { bookId, returnDate, quantity } = await req.json();
    const userId = session.user.id;

    if (!bookId || !returnDate || !quantity) {
        return new NextResponse('Missing required fields.', { status: 400 });
    }

    if (quantity > 1) {
        // Untuk saat ini, kita hanya support pinjam 1 copy per transaksi
        return new NextResponse('Peminjaman multi-copy belum didukung.', { status: 400 });
    }

    try {
        // --- TRANSAKSI DATABASE ---
        const result = await prisma.$transaction(async (tx) => {

            // 1. Cari BookItem yang tersedia (AVAILABLE) untuk judul ini
            const availableItem = await tx.bookItem.findFirst({
                where: {
                    titleId: bookId,
                    status: 'AVAILABLE',
                },
                select: {
                    id: true,
                    barcodeSN: true,
                    title: { select: { title: true } }
                }
            });

            if (!availableItem) {
                throw new Error("Maaf, stok buku ini sedang tidak tersedia untuk dipinjam.");
            }

            // 2. Buat record baru di tabel Loan (status: REQUESTED)
            const loan = await tx.loan.create({
                data: {
                    userId: userId,
                    itemId: availableItem.id,
                    dueDate: new Date(returnDate),
                    status: 'REQUESTED',
                    // borrowDate otomatis now()
                }
            });

            // 3. Update status BookItem yang dipinjam ke ON_LOAN
            await tx.bookItem.update({
                where: { id: availableItem.id },
                data: { status: 'ON_LOAN' }
            });

            return { loan, availableItem };
        });
        // --- AKHIR TRANSAKSI DATABASE ---


        // --- KIRIM NOTIFIKASI EMAIL KE ADMIN ---
        const bookTitle = result.availableItem.title.title;
        const userName = session.user.name || session.user.email;

        const emailHtml = `
            <h1>Permintaan Pinjaman Baru Diajukan</h1>
            <p><strong>Buku:</strong> ${bookTitle}</p>
            <p><strong>Kode Item:</strong> ${result.availableItem.barcodeSN}</p>
            <p><strong>Oleh User:</strong> ${userName} (${session.user.email})</p>
            <p><strong>Tanggal Pengembalian Diminta:</strong> ${new Date(returnDate).toDateString()}</p>
            <p>Silakan masuk ke Admin Panel untuk menyetujui permintaan ini.</p>
        `;

        await sendEmail({
            to: ADMIN_EMAIL,
            subject: `[LOAN REQUEST] Pinjaman Baru: ${bookTitle}`,
            html: emailHtml,
        });
        // --- AKHIR KIRIM EMAIL ---


        return NextResponse.json({
            message: 'Loan request submitted successfully.',
            loanId: result.loan.id,
            dueDate: result.loan.dueDate,
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error processing loan request:', error);

        let errorMessage = error.message;
        if (error.code === 'P2002') {
            errorMessage = 'Anda sudah memiliki permintaan pinjaman aktif untuk item ini.';
        }

        return new NextResponse(errorMessage, { status: 400 });
    }
}

// Tambahkan handler GET jika API perlu diakses dari tempat lain
export async function GET() {
    return new NextResponse('Method not allowed.', { status: 405 });
}