import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const books = await prisma.bookTitle.findMany({
            // Pilih field yang dibutuhkan saja agar payload ringan
            select: {
                id: true,
                title: true,
                author: true,
                category: true,
                coverImage: true,
                avgRating: true,
            },
            orderBy: {
                title: 'asc', // Urutkan berdasarkan Judul
            }
        });
        return NextResponse.json(books);
    } catch (error) {
        console.error("Error fetching books:", error);
        return new NextResponse('Failed to fetch book titles', { status: 500 });
    }
}