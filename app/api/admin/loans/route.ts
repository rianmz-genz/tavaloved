// file: app/api/admin/loans/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    // Proteksi: Hanya Admin yang bisa melihat daftar pinjaman
    if (!session || session.user.role !== 'ADMIN') {
        return new NextResponse('Forbidden: Admin access required', { status: 403 });
    }

    try {
        const loans = await prisma.loan.findMany({
            where: {
                // Tampilkan yang masih perlu diproses (REQUESTED) atau yang sedang berjalan (APPROVED)
                status: {
                    in: ['REQUESTED', 'APPROVED']
                }
            },
            select: {
                id: true,
                borrowDate: true,
                dueDate: true,
                status: true,
                returnDate: true, // Untuk jaga-jaga
                
                // Detail User yang meminjam
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                // Detail Item dan Judul Buku
                item: {
                    select: {
                        barcodeSN: true,
                        title: {
                            select: {
                                title: true, // Judul Buku
                            }
                        }
                    }
                }
            },
            orderBy: {
                borrowDate: 'asc', // Tampilkan permintaan yang paling lama dulu
            }
        });

        return NextResponse.json(loans);
    } catch (error) {
        console.error("Error fetching loan requests:", error);
        return new NextResponse('Internal server error.', { status: 500 });
    }
}