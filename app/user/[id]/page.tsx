// file: app/user/[id]/page.tsx

import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Star, BookOpen, User, Share2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// --- Interfaces Data Publik ---
interface Review {
  id: string;
  text: string;
  rating: number;
  reviewDate: string;
  title: {
    title: string;
    author: string;
    coverImage: string | null;
  };
}
interface PublicProfile {
  id: string;
  name: string | null;
  email: string | null; // Disensor di API
  image: string | null;
  totalBooksFinished: number;
  reviews: Review[];
}

// --- Fetcher untuk Server Component ---
async function fetchUserProfile(userId: string): Promise<PublicProfile | null> {
  // Pastikan NEXT_PUBLIC_BASE_URL sudah di-setup di .env
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/api/users/${userId}`,
    {
      next: { revalidate: 3600 },
    }
  );

  if (res.status === 404) return null;
  if (!res.ok)
    throw new Error(`Failed to fetch user profile: ${await res.text()}`);

  return res.json();
}

// --- Generate Dynamic Metadata (SEO) ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const profile = await fetchUserProfile((await params).id);

  if (!profile) {
    return {
      title: "Profil Tidak Ditemukan",
      description: "Profil pengguna tidak ada.",
    };
  }

  const title = `${profile.name || "Anggota TAVALOVEd"} | Prestasi Membaca`;
  const description = `Lihat ${
    profile.name || "anggota ini"
  } telah menamatkan ${profile.totalBooksFinished} buku di TAVALOVEd Library.`;

  return {
    title: title,
    description: description,
    keywords: [
      "Tavaloved",
      "Prestasi Membaca",
      profile.name || "Profil Anggota",
    ],
    openGraph: {
      title: title,
      description: description,
      type: "profile",
      images: [
        {
          url:
            profile.image ||
            "https://placehold.co/1200x630/f9a8d4/111?text=TAVALOVEd+Profile",
          width: 1200,
          height: 630,
          alt: profile.name || "Foto Profil",
        },
      ],
    },
  };
}

// --- Component Utama ---
export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await fetchUserProfile((await params).id);
console.log(profile)
  if (!profile) {
    notFound();
  }

  // Helper untuk format tanggal
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="flex min-h-screen justify-center bg-secondary/30 dark:bg-zinc-950 font-sans">
      <main className="w-full max-w-4xl px-4 py-12">
        <Link
          href="/"
          className="flex items-center text-primary hover:text-primary/80 mb-6 font-medium"
        >
          &larr; Kembali ke Koleksi
        </Link>

        <Card className="shadow-2xl border-primary/50">
          <CardHeader className="bg-primary/10 p-6 rounded-t-xl">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative w-20 h-20 rounded-full bg-card border-4 border-primary shadow-lg overflow-hidden">
                {profile.image ? (
                  <Image
                    src={profile.image}
                    alt={profile.name || "User Avatar"}
                    layout="fill"
                    objectFit="cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Nama & Email */}
              <div>
                <h1 className="text-3xl font-semibold text-foreground">
                  {profile.name || "Anggota TAVALOVEd"}
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {profile.email}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* --- PRESTASI UTAMA --- */}
            <div className="grid grid-cols-2 gap-4 mb-8 border-b pb-4">
              <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xl font-semibold text-primary">
                    {profile.totalBooksFinished}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Buku Ditamatkan
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg">
                <Share2 className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xl font-semibold text-primary">
                    #{profile.id.substring(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">ID Anggota</p>
                </div>
              </div>
            </div>

            {/* --- RIWAYAT REVIEW --- */}
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500" />{" "}
              Ulasan Terbaru ({profile.reviews.length})
            </h2>

            <div className="space-y-6">
              {profile.reviews.length === 0 ? (
                <p className="text-muted-foreground italic">
                  Anggota ini belum memberikan ulasan apa pun.
                </p>
              ) : (
                profile.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 bg-card shadow-sm rounded-lg border-l-4 border-primary/50"
                  >
                    <div className="flex justify-between items-center text-sm mb-2">
                      <div className="font-semibold text-lg text-primary line-clamp-1">
                        {review.title.title}
                      </div>
                      <div className="text-yellow-500 flex items-center text-sm ml-4">
                        {Array(review.rating)
                          .fill(0)
                          .map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                      </div>
                    </div>

                    <p className="text-sm italic text-zinc-700 dark:text-zinc-300">
                      "{review.text}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Penulis: {review.title.author} &bull; Pada:{" "}
                      {formatDate(review.reviewDate)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
