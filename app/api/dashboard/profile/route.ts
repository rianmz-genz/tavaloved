// file: app/api/dashboard/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { writeFile, access, mkdir } from 'fs/promises';
import path from 'path';
import { authOptions } from '../../auth/[...nextauth]/route';
// import { authOptions } from '../../auth/[...nextauth]/route'; // Uncomment jika diperlukan

// Helper function untuk membuat URL yang aman (Slug)
const slugify = (text: string) => {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
};

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;
    
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                nomorHp: true,
                totalBooksFinished: true,
                image: true,
            }
        });

        if (!user) {
            return new NextResponse('User not found in database.', { status: 404 });
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error('Error fetching user profile:', error);
        return new NextResponse('Internal server error.', { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    // const session = await getServerSession(authOptions); // Gunakan authOptions jika ada
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;
    
    // --- AMBIL DATA SEBAGAI FormData ---
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const nomorHp = formData.get('nomorHp') as string;
    const profileImageFile = formData.get('image') as File | null; 

    if (!name || !nomorHp) {
        return new NextResponse('Nama dan Nomor HP wajib diisi.', { status: 400 });
    }

    let imageUrl: string | undefined = undefined;

    // --- PROSES UPLOAD GAMBAR BARU ---
    if (profileImageFile && profileImageFile.size > 0 && profileImageFile.name) {
        const bytes = await profileImageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Gunakan ID user untuk nama file yang unik
        const fileExtension = path.extname(profileImageFile.name);
        // Tambahkan timestamp untuk memastikan URL selalu unik
        const safeFileName = `${userId}-${slugify(name || 'user')}-${Date.now()}${fileExtension}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        const uploadPath = path.join(uploadDir, safeFileName); 

        try { 
            await access(uploadDir); 
        } catch (error) { 
            await mkdir(uploadDir, { recursive: true }); 
        }

        await writeFile(uploadPath, buffer);
        imageUrl = `/uploads/avatars/${safeFileName}`; 
    }
    // ---------------------------------

    try {
        const updateData: any = { name, nomorHp };
        if (imageUrl) {
            updateData.image = imageUrl; // Update field 'image' jika ada file baru
        }
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                nomorHp: true,
                totalBooksFinished: true,
                image: true,
            }
        });

        return NextResponse.json({
            message: 'Profile updated successfully.',
            user: updatedUser
        });

    } catch (error: any) {
        console.error('Error updating profile:', error);
        
        let errorMessage = error.message;
        if (error.code === 'P2002' && error.meta?.target?.includes('nomor_hp')) {
             errorMessage = 'Nomor HP sudah digunakan oleh akun lain.';
        } else if (error.message.includes('EACCES')) {
             errorMessage = 'Gagal menyimpan file: Izin akses ditolak.';
        }
        
        return new NextResponse(errorMessage, { status: 400 });
    }
}