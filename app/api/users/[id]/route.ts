// file: app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = (await params).id;

    if (!userId) {
        return new NextResponse("User ID missing.", { status: 400 });
    }

    try {
        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                totalBooksFinished: true,

                // Ambil semua reviews yang dibuat user, termasuk detail bukunya
                reviews: {
                    select: {
                        id: true,
                        text: true,
                        rating: true,
                        reviewDate: true,
                        title: {
                            select: {
                                title: true,
                                author: true,
                                coverImage: true,
                            }
                        }
                    },
                    orderBy: {
                        reviewDate: 'desc',
                    }
                }
            }
        });

        if (!userProfile) {
            return new NextResponse("User not found.", { status: 404 });
        }
        const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`;
        // Hapus email (atau sensor) jika email tidak boleh dilihat publik
        const publicData = {
            ...userProfile,
            image: publicUrl + (userProfile.image || '/default-avatar.png'),
            email: userProfile.email ? userProfile.email.split('@')[0] + '@***.com' : 'N/A',
            // Kita biarkan email disensor untuk privasi
        };

        return NextResponse.json(publicData);

    } catch (error) {
        console.error("Error fetching public user profile:", error);
        return new NextResponse('Internal server error.', { status: 500 });
    }
}