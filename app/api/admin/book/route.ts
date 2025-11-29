// file: app/api/admin/book/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { writeFile, access, mkdir } from 'fs/promises'; // TAMBAHKAN access dan mkdir
import path from 'path';

// Helper function untuk membuat URL yang aman (Slug)
const slugify = (text: string) => {
    return text.toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};


// Handler POST untuk menambah buku
export async function POST(req: NextRequest) {
    try {

        // 1. Ambil FormData
        const formData = await req.formData();

        // 2. Ambil semua field
        const title = formData.get('title') as string;
        const author = formData.get('author') as string;
        const synopsis = formData.get('synopsis') as string;
        const category = formData.get('category') as string;
        const barcodeSN = formData.get('barcodeSN') as string;
        const condition = formData.get('condition') as string;
        const ownerId = formData.get('ownerId') as string;
        const coverFile = formData.get('coverImage') as File; // Ambil file cover

        if (!title || !author || !category || !barcodeSN || !ownerId || !coverFile) {
            return new NextResponse('Missing required fields, including cover image.', { status: 400 });
        }

        let coverImageUrl = null;
        if (coverFile instanceof File) {
            const bytes = await coverFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Buat nama file unik dan aman
            const fileExtension = path.extname(coverFile.name);
            const safeFileName = `${slugify(title)}-${Date.now()}${fileExtension}`;

            // Tentukan folder tujuan (path tanpa nama file)
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            const uploadPath = path.join(uploadDir, safeFileName); // Path file lengkap

            // **LANGKAH BARU: CEK & BUAT FOLDER DULU**
            try {
                // Cek apakah direktori sudah ada (dengan hak akses)
                await access(uploadDir);
            } catch (error) {
                // Jika error (tidak ada direktori/akses), buat direktori
                await mkdir(uploadDir, { recursive: true }); // recursive: true = buat folder induk jika belum ada
            }

            // TULIS FILE KE PATH LENGKAP
            await writeFile(uploadPath, buffer);

            // URL yang akan disimpan di database
            coverImageUrl = `/uploads/${safeFileName}`;
        }
        // -------------------------

        // Cek apakah judul buku sudah ada
        let bookTitle = await prisma.bookTitle.findUnique({
            where: { title: title },
        });

        if (!bookTitle) {
            // Jika judul belum ada, buat BookTitle baru
            bookTitle = await prisma.bookTitle.create({
                data: {
                    title: title,
                    author: author,
                    synopsis: synopsis,
                    category: category,
                    coverImage: coverImageUrl, // <-- SIMPAN URL GAMBAR
                },
            });
        } else {
            // Jika judul sudah ada, kamu bisa update cover imagenya jika file baru diupload
            if (coverImageUrl) {
                await prisma.bookTitle.update({
                    where: { id: bookTitle.id },
                    data: { coverImage: coverImageUrl },
                });
            }
        }

        // Buat BookItem (stok) baru
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
            cover: coverImageUrl
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error adding book:', error);

        if (error.code === 'P2002') {
            return new NextResponse('Barcode/SN sudah digunakan. Cek kembali.', { status: 409 });
        }

        return new NextResponse(`Server error: ${error.message}`, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {


        // Ambil ID dari query parameter
        const { searchParams } = new URL(req.url);
        const bookId = searchParams.get('id');

        if (!bookId) {
            return new NextResponse('Missing book ID.', { status: 400 });
        }

        // 1. Hapus semua BookItem terkait (karena relasi di schema.prisma adalah RESTRICT/SET NULL)
        // Kita perlu menghapus BookItem secara eksplisit (atau pastikan CASCADE di DB)
        // Berdasarkan schema kamu, BookItem memiliki fk_id_judul yang me-refer BookTitle.
        // Kita asumsikan relasi adalah CASCADE DELETE agar semua item terhapus otomatis.

        // Tapi karena kamu pakai RESTRICT di beberapa tempat, kita lakukan secara eksplisit untuk aman:
        await prisma.bookItem.deleteMany({
            where: {
                titleId: bookId,
            }
        });

        // 2. Hapus BookTitle
        const deletedBook = await prisma.bookTitle.delete({
            where: { id: bookId },
        });

        return NextResponse.json({
            message: 'Book title and associated items deleted successfully.',
            deletedId: deletedBook.id
        });

    } catch (error: any) {
        // P2025 = Not Found
        if (error.code === 'P2025') {
            return new NextResponse('Book not found.', { status: 404 });
        }
        console.error('Error deleting book:', error);
        return new NextResponse('Internal server error during deletion.', { status: 500 });
    }
}