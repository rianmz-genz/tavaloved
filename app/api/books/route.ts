// file: app/api/books/route.ts

import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const books = await prisma.bookTitle.findMany({
            select: {
                id: true,
                title: true,
                author: true,
                // Pastikan nama field sesuai dengan schema (judul, penulis, dll)
                coverImage: true,
                avgRating: true,
                synopsis: true,
                // --- PENTING: Sertakan relasi Categories ---
                categories: {
                    select: {
                        category: {
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                title: 'asc',
            }
        });

        return NextResponse.json(books);
    } catch (error) {
        console.error("Error fetching books:", error);
        return new NextResponse('Failed to fetch book titles', { status: 500 });
    }
}