// file: app/api/dashboard/history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    // 1. Cek Autentikasi
    if (!session || !session.user || !session.user.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    try {
        const history = await prisma.loan.findMany({
            where: { userId: userId },
            select: {
                id: true,
                borrowDate: true,
                dueDate: true,
                returnDate: true,
                status: true,

                // Detail Buku
                item: {
                    select: {
                        id: true, // itemId
                        barcodeSN: true,
                        title: {
                            select: {
                                id: true, // bookTitleId
                                title: true,
                                author: true,
                                coverImage: true,
                            }
                        }
                    }
                },
            },
            orderBy: {
                borrowDate: 'desc', // Terbaru di atas
            }
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("Error fetching user dashboard history:", error);
        return new NextResponse('Internal server error.', { status: 500 });
    }
}