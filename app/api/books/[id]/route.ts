// file: app/api/books/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Menerima params sebagai object, bukan Promise
) {
    // Pastikan ID diambil langsung dari params
    const bookId = (await params).id;

    if (!bookId) {
        return new NextResponse("Missing book ID.", { status: 400 });
    }

    try {
        const book = await prisma.bookTitle.findUnique({
            where: { id: bookId },
            select: {
                id: true,
                title: true,
                author: true,
                synopsis: true,
                coverImage: true,
                avgRating: true,

                // Sertakan relasi Categories (tags)
                categories: {
                    select: {
                        category: {
                            select: {
                                name: true,
                            }
                        }
                    }
                },

                // Sertakan relasi Reviews
                reviews: {
                    select: {
                        id: true,
                        text: true,
                        rating: true,
                        // reviewDate harus sesuai casing output Prisma
                        reviewDate: true,
                        user: {
                            select: {
                                name: true,
                            }
                        }
                    },
                    // MENGHAPUS orderBy SEMENTARA untuk menghindari bug casing pada mapped field
                    // orderBy: { reviewDate: 'desc' }
                }
            }
        });

        if (!book) {
            return new NextResponse("Book not found.", { status: 404 });
        }

        // --- DEBUG LOG: Cek di terminal Anda ---
        console.log(`[API DETAIL] Fetched Book ID: ${book.id}`);
        console.log(`[API DETAIL] Reviews Found: ${book.reviews.length}`);
        if (book.reviews.length > 0) {
            console.log(`[API DETAIL] Sample Review Text: ${book.reviews[0].text}`);
        }
        // ----------------------------------------

        return NextResponse.json(book);

    } catch (error) {
        console.error("Error fetching book detail:", error);
        return new NextResponse('Internal server error.', { status: 500 });
    }
}