// file: app/book/[slug]/page.tsx

import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

// Import komponen client (jika digunakan)
import { BorrowingModule } from "@/components/book/borrowing-module";
// Asumsi BookCover adalah Client Component dan sudah di-wrap SessionProvider (jika perlu)

// --- Interfaces ---
interface Category {
  category: { name: string };
}
interface Review {
  id: string;
  text: string;
  rating: number;
  reviewDate: string;
  user: { name: string | null };
}
export interface BookTitle {
  id: string;
  title: string;
  author: string;
  synopsis: string;
  coverImage?: string | null;
  avgRating: number;
  categories: Category[];
  reviews: Review[];
}

// --- Fetcher Khusus untuk Server Component ---
async function fetchBookDetail(bookId: string): Promise<BookTitle | null> {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/api/books/${bookId}`,
    {
      // Cache data
      // Gunakan no-cache di development jika terjadi masalah caching
      // cache: 'no-store'
      cache: "no-store", // Mengabaikan cache
    }
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    // Log error dari server
    const errorText = await res.text();
    console.error(`Fetch error from API: ${errorText}`);
    throw new Error(`Failed to fetch book detail: ${errorText}`);
  }

  return res.json();
}

// --- Generate Dynamic Metadata (SEO) ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  // 1. Ekstraksi ID dari slug
  // Ambil ID dari bagian awal slug (ID-judul-buku)
  const bookId = (await params).slug?.split("-")[0];
  const book = await fetchBookDetail(bookId);
  console.log(book);

  if (!book) {
    return {
      title: "Book Not Found",
      description: "The requested book could not be found.",
    };
  }

  const title = `${book.title} by ${book.author} | TAVALOVEd Library`;
  const description = book.synopsis
    ? book.synopsis.substring(0, 150) + "..."
    : `Detail lengkap buku ${book.title}.`;

  return {
    title: title,
    description: description,
    keywords: [
      ...book.categories.map((c) => c.category.name),
      book.title,
      book.author,
    ].join(", "),
    openGraph: {
      title: title,
      description: description,
      type: "article",
      images: [
        {
          url:
            book.coverImage ||
            "https://placehold.co/1200x630/f9a8d4/111?text=TAVALOVEd+Library",
          width: 1200,
          height: 630,
          alt: book.title,
        },
      ],
    },
  };
}

// --- Component Utama (Server Component) ---
export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 1. Ekstraksi ID dari slug (Pastikan ini dilakukan dengan benar)
  const bookId = (await params).slug.split("-")[0];

  if (!bookId) {
    // Jika slug tidak valid (misal hanya "/book/"), harusnya notFound()
    notFound();
  }

  const detail = await fetchBookDetail(bookId);

  if (!detail) {
    notFound();
  }

  return (
    <div className="flex min-h-screen justify-center bg-secondary/30 dark:bg-zinc-950 font-sans">
      <main className="w-full max-w-5xl px-4 py-12">
        <Link
          href="/"
          className="flex items-center text-primary hover:text-primary/80 mb-6 font-medium"
        >
          <X className="w-4 h-4 rotate-45 mr-2" /> Back to Collection
        </Link>

        <div className="p-8 bg-card shadow-xl rounded-xl dark:border dark:border-zinc-700">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Kolom Kiri: Cover dan Borrowing Module */}
            <div className="shrink-0 w-full md:w-1/3">
              {/* Book Cover */}
              {/* Mengganti BookCover component dummy dengan logic render langsung */}
              <Image
                src={
                  detail.coverImage ||
                  "https://placehold.co/150x220/f9a8d4/111?text=No+Cover"
                }
                alt={detail.title}
                width={250}
                height={350}
                className="rounded-lg shadow-2xl object-cover w-full h-auto mx-auto"
                unoptimized
              />
              <div className="mt-4 text-center">
                <span className="flex items-center justify-center text-lg font-bold text-yellow-500">
                  <Star className="w-5 h-5 mr-1" fill="currentColor" />{" "}
                  {detail.avgRating.toFixed(1)}
                </span>
              </div>

              {/* Borrowing Module (Client Component) */}
              <BorrowingModule book={{ id: detail.id, title: detail.title }} />
            </div>

            {/* Detail Konten */}
            <div className="grow">
              <h1 className="text-4xl font-bold text-primary mb-2">
                {detail.title}
              </h1>
              <h2 className="text-xl text-zinc-600 dark:text-zinc-400 mb-4">
                by {detail.author}
              </h2>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {detail.categories.map((cat, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-secondary text-primary rounded-full font-medium"
                  >
                    {cat.category.name}
                  </span>
                ))}
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-2 text-foreground">
                Synopsis
              </h3>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed border-l-4 border-primary/50 pl-4 py-1">
                {detail.synopsis}
              </p>

              {/* Review Section */}
              <h3 className="text-2xl font-bold mt-8 mb-4 text-foreground">
                Reader Reviews
              </h3>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {detail.reviews && detail.reviews.length > 0 ? (
                  detail.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-primary">
                          {review.user.name || "Anonymous"}
                        </span>
                        <span className="text-yellow-500 flex items-center">
                          {Array(review.rating)
                            .fill(0)
                            .map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4"
                                fill="currentColor"
                              />
                            ))}
                        </span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 text-base italic">
                        {review.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 italic">
                    No reviews yet for this book.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
