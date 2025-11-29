// file: app/api/admin/book/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { writeFile, access, mkdir, unlink } from 'fs/promises'; // Tambahkan unlink untuk hapus file
import path from 'path';

// ... (fungsi slugify tetap sama)
const slugify = (text: string) => {
    return text.toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};


// Handler POST (Menambah Buku & Tags)
export async function POST(req: NextRequest) {
    try {
       

        const formData = await req.formData();
        
        const title = formData.get('title') as string;
        const author = formData.get('author') as string;
        const synopsis = formData.get('synopsis') as string;
        const rawCategories = formData.get('category') as string; // String kategori dipisahkan koma
        const barcodeSN = formData.get('barcodeSN') as string;
        const condition = formData.get('condition') as string;
        const ownerId = formData.get('ownerId') as string; // ID user pemilik
        const coverFile = formData.get('coverImage') as File; 

        if (!title || !author || !rawCategories || !barcodeSN || !ownerId || !(coverFile instanceof File)) {
             return new NextResponse('Missing required fields, including cover image or categories.', { status: 400 });
        }
        
        // Pisahkan kategori (misal: "Fiksi, Romance" -> ["Fiksi", "Romance"])
        const categoryNames = rawCategories.split(',').map(name => name.trim()).filter(name => name.length > 0);
        
        // --- PROSES UPLOAD FILE ---
        let coverImageUrl = null;
        if (coverFile instanceof File) {
            const bytes = await coverFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileExtension = path.extname(coverFile.name);
            const safeFileName = `${slugify(title)}-${Date.now()}${fileExtension}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            const uploadPath = path.join(uploadDir, safeFileName); 

            try { await access(uploadDir); } catch (error) { await mkdir(uploadDir, { recursive: true }); }

            await writeFile(uploadPath, buffer);
            coverImageUrl = `/uploads/${safeFileName}`; 
        }
        // -------------------------

        // 1. Cari atau Buat BookTitle
        let bookTitle = await prisma.bookTitle.findUnique({ where: { title: title }, });

        if (!bookTitle) {
            bookTitle = await prisma.bookTitle.create({
                data: {
                    title: title,
                    author: author,
                    synopsis: synopsis,
                    coverImage: coverImageUrl, 
                },
            });
        }
        
        // 2. Proses Kategori (Tags)
        if (categoryNames.length > 0) {
            // Hapus semua relasi lama jika ini update (opsional)
            // await prisma.bookCategory.deleteMany({ where: { bookId: bookTitle.id } });

            for (const name of categoryNames) {
                // Cari atau buat Category baru
                const category = await prisma.category.upsert({
                    where: { name: name },
                    update: {},
                    create: { name: name },
                });

                // Buat relasi di tabel BookCategory
                try {
                    await prisma.bookCategory.create({
                        data: {
                            bookId: bookTitle.id,
                            categoryId: category.id,
                        },
                    });
                } catch (e) {
                    // Abaikan jika relasi (bookId, categoryId) sudah ada
                }
            }
        }

        // 3. Buat BookItem (stok) baru
        const bookItem = await prisma.bookItem.create({
            data: {
                barcodeSN: barcodeSN,
                condition: condition,
                titleId: bookTitle.id,
                ownerId: ownerId, 
            },
        });

        return NextResponse.json({ 
            message: 'Book successfully created/updated.', 
            title: bookTitle, 
            item: bookItem,
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error adding book:', error);
        if (error.code === 'P2002') {
             return new NextResponse('Barcode/SN sudah digunakan atau Judul sudah ada.', { status: 409 });
        }
        return new NextResponse(`Server error: ${error.message}`, { status: 500 });
    }
}


// Handler DELETE (Hapus Buku & Item Terkait)
export async function DELETE(req: NextRequest) {
    try {


        const { searchParams } = new URL(req.url);
        const bookId = searchParams.get('id');

        if (!bookId) { return new NextResponse('Missing book ID.', { status: 400 }); }

        // Cari dulu data buku untuk mendapatkan URL gambar (jika ada)
        const book = await prisma.bookTitle.findUnique({ where: { id: bookId } });
        if (!book) { return new NextResponse('Book not found.', { status: 404 }); }

        await prisma.$transaction(async (tx) => {
            // 1. Hapus relasi BookCategory
            await tx.bookCategory.deleteMany({ where: { bookId: bookId } });

            // 2. Hapus BookItem terkait
            await tx.bookItem.deleteMany({ where: { titleId: bookId } });
            
            // 3. Hapus BookTitle
            await tx.bookTitle.delete({ where: { id: bookId } });

            // 4. Hapus file gambar dari server (Non-blocking)
            if (book.coverImage) {
                const filePath = path.join(process.cwd(), 'public', book.coverImage);
                try {
                    await unlink(filePath);
                } catch (err: any) {
                    // Abaikan jika file tidak ditemukan (ENOENT)
                    if (err.code !== 'ENOENT') {
                        console.error('Error deleting file:', err);
                    }
                }
            }
        });


        return NextResponse.json({ 
            message: 'Book title, items, and relations deleted successfully.', 
            deletedId: bookId
        });

    } catch (error: any) {
        if (error.code === 'P2025') { return new NextResponse('Book not found.', { status: 404 }); }
        console.error('Error deleting book:', error);
        return new NextResponse('Internal server error during deletion.', { status: 500 });
    }
}