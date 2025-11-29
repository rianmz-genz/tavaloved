// file: app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useSession, signIn } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Clock, LogIn, Check, Star, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";

// --- Interfaces (TETAP SAMA) ---
interface BookTitleInfo {
  title: string;
  author: string;
  coverImage: string | null;
  id: string;
}
interface LoanItem {
  id: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "RETURNED";
  item: {
    id: string;
    title: BookTitleInfo;
  };
}
interface ReviewFormDetails {
  loanId: string;
  bookTitle: string;
  titleId: string;
  rating: number; // 1-5
  reviewText: string;
}

// --- FUNGSI FETCH & SUBMIT (TETAP SAMA) ---
const fetchUserHistory = async (): Promise<any> => { 
  const response = await fetch("/api/dashboard/history");
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal memuat riwayat peminjaman.");
  }
  return response.json();
};

const submitReturnAndReview = async (
  loanId: string,
  titleId: string,
  rating: number,
  reviewText: string
) => {
  const response = await fetch("/api/dashboard/return", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loanId, rating, reviewText, titleId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal memproses pengembalian.");
  }
  return response.json();
};
// ------------------------------------


// --- KOMPONEN BARU: STAR RATING INPUT ---
interface StarRatingProps {
    rating: number;
    setRating: (rating: number) => void;
}

const StarRatingInput: React.FC<StarRatingProps> = ({ rating, setRating }) => {
    const [hover, setHover] = useState(0);
    const maxRating = 5;

    return (
        <div className="flex justify-center space-x-1">
            {[...Array(maxRating)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <Star
                        key={index}
                        className={`w-8 h-8 cursor-pointer transition-colors duration-200 
                            ${starValue <= (hover || rating) ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-300 fill-zinc-200 dark:text-zinc-500 dark:fill-zinc-700'}`
                        }
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHover(starValue)}
                        onMouseLeave={() => setHover(0)}
                    />
                );
            })}
        </div>
    );
};
// -----------------------------------------


export default function UserDashboardPage() {
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<LoanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Dialog & Submitting
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnDetails, setReturnDetails] = useState<ReviewFormDetails | null>(
    null
  );

  const loadHistory = useCallback(async () => {
    if (status !== "authenticated") return;
    setIsLoading(true);
    try {
      const data = await fetchUserHistory();
      setHistory(data);
    } catch (e: any) {
      toast.error("Gagal Memuat Data", { description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // --- Handlers ---
  const handleOpenReturnDialog = (loan: LoanItem) => {
    setReturnDetails({
      loanId: loan.id,
      bookTitle: loan.item.title.title,
      titleId: loan.item.title.id,
      rating: 5, // Default rating 5
      reviewText: "",
    });
    setIsDialogOpen(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnDetails || isSubmitting) return;

    // Tambahkan validasi minimum rating
    if (returnDetails.rating < 1 || returnDetails.rating > 5) {
        toast.error("Validasi Rating", { description: "Rating harus antara 1 sampai 5 bintang." });
        return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading(
      "Memproses pengembalian dan ulasan..."
    );

    try {
      await submitReturnAndReview(
        returnDetails.loanId,
        returnDetails.titleId,
        returnDetails.rating,
        returnDetails.reviewText
      );

      toast.success("Pengembalian Berhasil!", {
        description: `Buku ${returnDetails.bookTitle} berhasil dikembalikan dan ulasan tersimpan.`,
      });

      // Refresh history
      await loadHistory();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Gagal Memproses", { description: error.message });
    } finally {
      setIsSubmitting(false);
      toast.dismiss(loadingToastId);
    }
  };
  
  // Update handler rating dari komponen StarRatingInput
  const setStarRating = (newRating: number) => {
    setReturnDetails(prev => (prev ? { ...prev, rating: newRating } : null));
  };


  // --- Helper Tampilan (Tetap Sama) ---
  const formatStatus = (status: LoanItem["status"]) => {
    const baseStyle = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "APPROVED":
        return (
          <span className={`${baseStyle} bg-blue-100 text-blue-700`}>
            Dipinjam
          </span>
        );
      case "REQUESTED":
        return (
          <span className={`${baseStyle} bg-yellow-100 text-yellow-700`}>
            Menunggu
          </span>
        );
      case "RETURNED":
        return (
          <span className={`${baseStyle} bg-green-100 text-green-700`}>
            Dikembalikan
          </span>
        );
      case "REJECTED":
        return (
          <span className={`${baseStyle} bg-red-100 text-red-700`}>
            Ditolak
          </span>
        );
      default:
        return (
          <span className={`${baseStyle} bg-zinc-100 text-zinc-700`}>
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filtering Loans
  const activeLoans = history.filter((l) => l.status === "APPROVED");
  const finishedLoans = history.filter(
    (l) => l.status === "RETURNED" || l.status === "REJECTED"
  );

  if (status === "loading") {
    return (
      <div className="text-center p-20">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />{" "}
        Loading User Session...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center p-20">
        <p className="text-xl text-destructive mb-4">
          Anda harus login untuk mengakses dashboard.
        </p>
        <Button onClick={() => signIn("email")} size="lg">
          <LogIn className="w-5 h-5 mr-2" /> Masuk ke Akun Anda
        </Button>
      </div>
    );
  }

  // --- Tampilan User Dashboard ---
  return (
    <Fragment>
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-semibold text-foreground mb-1">
          Halo, {session?.user?.name || session?.user?.email}!
        </h1>
        <p className="text-muted-foreground mb-8">
          Dashboard pribadi Anda dan riwayat aktivitas peminjaman.
        </p>

        {/* --- DASHBOARD RINGKASAN --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="p-5">
            <CardTitle className="text-xl text-primary">
              Total Pinjaman
            </CardTitle>
            <p className="text-4xl font-semibold mt-2">{history.length}</p>
          </Card>
          <Card className="p-5">
            <CardTitle className="text-xl text-primary">
              Sedang Dipinjam
            </CardTitle>
            <p className="text-4xl font-semibold mt-2">{activeLoans.length}</p>
          </Card>
          <Card className="p-5">
            <CardTitle className="text-xl text-primary">
              Menunggu Persetujuan
            </CardTitle>
            <p className="text-4xl font-semibold mt-2">
              {history.filter((l) => l.status === "REQUESTED").length}
            </p>
          </Card>
        </div>

        {/* --- BUKU SEDANG DIPINJAM (ACTIVE LOANS) --- */}
        <h2 className="text-3xl font-semibold text-foreground mb-4 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-primary" /> Buku yang Sedang
          Dipinjam
        </h2>
        <Card className="shadow-lg mb-10">
          <CardContent className="p-6">
            {activeLoans.length === 0 ? (
              <p className="text-muted-foreground italic">
                Anda tidak sedang meminjam buku apa pun saat ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeLoans.map((loan) => (
                  <Card key={loan.id} className="p-4 flex gap-4 items-center">
                    <Image
                      src={
                        loan.item.title.coverImage ||
                        "https://placehold.co/80x120/f9a8d4/111?text=Cover"
                      }
                      alt={loan.item.title.title}
                      width={80}
                      height={120}
                      className="rounded-md object-cover shrink-0"
                      unoptimized
                    />
                    <div className="grow">
                      <h3 className="font-semibold text-lg line-clamp-1">
                        {loan.item.title.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        oleh {loan.item.title.author}
                      </p>
                      <p className="text-xs text-destructive mt-1">
                        **Kembalikan sebelum:** {formatDate(loan.dueDate)}
                      </p>
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => handleOpenReturnDialog(loan)}
                      >
                        <Check className="w-4 h-4 mr-1" /> Tandai Dikembalikan &
                        Review
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- RIWAYAT PEMINJAMAN --- */}
        <h2 className="text-3xl font-semibold text-foreground mb-4 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-primary" /> Riwayat Peminjaman
          Saya ({finishedLoans.length})
        </h2>
        <Card className="shadow-lg">
          <CardContent className="p-6">
            {finishedLoans.length === 0 ? (
              <p className="text-muted-foreground italic">
                Belum ada riwayat pengembalian atau penolakan.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      <th className="px-3 py-3">Buku</th>
                      <th className="px-3 py-3">Tgl Pinjam</th>
                      <th className="px-3 py-3">Tgl Kembali (Aktual)</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finishedLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-secondary/20">
                        <td className="px-3 py-3 text-sm font-semibold">
                          {loan.item.title.title}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {formatDate(loan.borrowDate)}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {formatDate(loan.returnDate)}
                        </td>
                        <td className="px-3 py-3">
                          {formatStatus(loan.status)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {/* Di sini nanti tombol Review jika belum */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- DIALOG PENGEMBALIAN DAN REVIEW --- */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <form onSubmit={handleReturnSubmit}>
              <DialogHeader>
                <DialogTitle>Kembalikan & Review Buku</DialogTitle>
                <DialogDescription>
                  Konfirmasi pengembalian **{returnDetails?.bookTitle}** dan
                  berikan ulasan Anda.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">
                    Rating Anda
                  </Label>
                  {/* KOMPONEN STAR RATING BARU */}
                  <div className="flex justify-center">
                    <StarRatingInput
                      rating={returnDetails?.rating ?? 5}
                      setRating={setStarRating}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewText">
                    Ulasan Singkat (Maks. 255 karakter)
                  </Label>
                  <Textarea
                    id="reviewText"
                    maxLength={255}
                    required
                    value={returnDetails?.reviewText}
                    onChange={(e) =>
                      setReturnDetails((prev) =>
                        prev ? { ...prev, reviewText: e.target.value } : null
                      )
                    }
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  type="button"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Konfirmasi Pengembalian
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Fragment>
  );
}