// file: components/admin/book-table.tsx

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
// Asumsi Dialog dkk sudah diimpor dari shadcn/ui

// --- Interface untuk tipe data BookTitle ---
interface BookTitle {
  id: string;
  title: string;
  author: string;
  category: string;
  coverImage?: string | null;
  avgRating: number;
}

// State baru untuk mengelola dialog
interface BookToDelete {
  id: string;
  title: string;
}

const fetchBooks = async (): Promise<BookTitle[]> => {
  const response = await fetch("/api/books");
  if (!response.ok) {
    throw new Error("Gagal mengambil daftar buku.");
  }
  return response.json();
};

const deleteBook = async (id: string) => {
  const response = await fetch(`/api/admin/book?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal menghapus buku.");
  }
  return response.json();
};

interface BookTableProps {
  refreshKey: number;
}

export function BookTable({ refreshKey }: BookTableProps) {
  const [books, setBooks] = useState<BookTitle[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // State untuk dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookToDelete | null>(null);

  const loadBooks = async () => {
    setIsFetching(true);
    try {
      const data = await fetchBooks();
      setBooks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [refreshKey]);

  // --- Fungsi yang benar-benar melakukan Delete (dengan minimal delay) ---
  const executeDelete = async () => {
    if (!selectedBook) return;

    const bookId = selectedBook.id;
    const bookTitle = selectedBook.title;

    // Set loading state dan tutup dialog (agar tidak mengganggu)
    setDeletingId(bookId);
    setOpenDialog(false);

    // 1. Mulai Toast Loading
    const deletingToastId = toast.loading(`Menghapus ${bookTitle}...`);

    // 2. Mulai timer (minimal 500ms) dan delete API request secara paralel
    const startTime = Date.now();

    try {
      await deleteBook(bookId);

      const endTime = Date.now();
      const duration = endTime - startTime;
      const minDuration = 500; // Minimal 500ms agar toast tidak kedip

      // Tambahkan delay jika proses terlalu cepat
      if (duration < minDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minDuration - duration)
        );
      }

      // 3. Sukses
      toast.success("Berhasil Dihapus", {
        description: `Judul "${bookTitle}" dan semua stok terkait telah dihapus.`,
        id: deletingToastId,
        duration: 3000, // Tampilkan 3 detik
      });

      await loadBooks();
    } catch (error: any) {
      // 4. Gagal
      toast.error("Gagal Menghapus Buku", {
        description: error.message,
        id: deletingToastId,
      });
      console.error(error);
    } finally {
      // 5. Cleanup
      setDeletingId(null);
      setSelectedBook(null);
      setTimeout(() => toast.dismiss(deletingToastId), 2000);
    }
  };

  // --- Handler Tombol Delete (Membuka Dialog) ---
  const handleOpenDeleteDialog = (book: BookTitle) => {
    setSelectedBook({ id: book.id, title: book.title });
    setOpenDialog(true);
  };
  // ---------------------------------------------

  return (
    <>
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-2xl">
            Daftar Judul Buku ({books.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isFetching && (
            <p className="text-center text-primary">Memuat data...</p>
          )}
          {!isFetching && books.length === 0 && (
            <p className="text-center text-muted-foreground">
              Belum ada judul buku yang terdaftar.
            </p>
          )}

          {!isFetching && books.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="px-3 py-3 w-20">Cover</th>
                    <th className="px-3 py-3">Judul & Penulis</th>
                    <th className="px-3 py-3">Kategori</th>
                    <th className="px-3 py-3 w-[100px]">Rating</th>
                    <th className="px-3 py-3 w-[100px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {book.coverImage ? (
                          <Image
                            src={book.coverImage}
                            alt={`Cover ${book.title}`}
                            width={50}
                            height={70}
                            className="rounded object-cover shadow-sm"
                            unoptimized
                          />
                        ) : (
                          <div className="w-[50px] h-[70px] bg-muted flex items-center justify-center text-xs rounded border border-dashed">
                            No Cover
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-semibold text-primary">
                          {book.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          oleh {book.author}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-secondary-foreground">
                        {book.category}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        ⭐ {book.avgRating.toFixed(1)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        {/* Tombol Delete Trigger */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(book)} // Membuka Dialog
                          disabled={deletingId === book.id || isFetching}
                        >
                          {deletingId === book.id ? (
                            "Hapus..."
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-1" /> Hapus
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- KOMPONEN DIALOG KONFIRMASI --- */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center">
              <Trash2 className="w-6 h-6 mr-2" /> Konfirmasi Penghapusan
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Anda yakin ingin menghapus judul buku **"{selectedBook?.title}"**?
            Tindakan ini permanen dan akan menghapus **SEMUA** stok fisik
            (BookItem) yang terkait dengan judul ini.
          </DialogDescription>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenDialog(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={executeDelete} // Panggil fungsi delete yang sebenarnya
              disabled={deletingId !== null}
            >
              Ya, Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
