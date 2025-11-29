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

// --- Interface untuk tipe data Category (relasi) ---
interface Category {
  category: {
    name: string;
  };
}

// --- Interface untuk tipe data BookTitle (UPDATE) ---
interface BookTitle {
  id: string;
  title: string;
  author: string;
  // Hapus: category: string;
  categories: Category[]; // GANTI: Menggunakan relasi categories
  coverImage?: string | null;
  avgRating: number;
}

// ... (State BookToDelete tetap sama)

const fetchBooks = async (): Promise<BookTitle[]> => {
  // Kita harus meminta API untuk menyertakan relasi Categories
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

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookTitle | null>(null);

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

  const executeDelete = async () => {
    if (!selectedBook) return;

    const bookId = selectedBook.id;
    const bookTitle = selectedBook.title;

    setDeletingId(bookId);
    setOpenDialog(false);

    const deletingToastId = toast.loading(`Menghapus ${bookTitle}...`);
    const startTime = Date.now();
    const minDuration = 500;

    try {
      await deleteBook(bookId);

      const duration = Date.now() - startTime;
      if (duration < minDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minDuration - duration)
        );
      }

      toast.success("Berhasil Dihapus", {
        description: `Judul "${bookTitle}" dan semua stok terkait telah dihapus.`,
        id: deletingToastId,
        duration: 3000,
      });

      await loadBooks();
    } catch (error: any) {
      toast.error("Gagal Menghapus Buku", {
        description: error.message,
        id: deletingToastId,
      });
      console.error(error);
    } finally {
      setDeletingId(null);
      setSelectedBook(null);
      setTimeout(() =>       toast.dismiss(deletingToastId), 3000)
    }
  };

  const handleOpenDeleteDialog = (book: BookTitle) => {
    setSelectedBook(book);
    setOpenDialog(true);
  };

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
                    <th className="px-3 py-3">Tags/Kategori</th>{" "}
                    {/* GANTI JUDUL KOLOM */}
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
                      <td className="px-3 py-4 text-sm text-secondary-foreground">
                        {/* TAMPILKAN TAGS/KATEGORI */}
                        <div className="flex flex-wrap gap-1">
                          {book.categories.map((cat, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium"
                            >
                              {cat.category.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        ⭐ {book.avgRating.toFixed(1)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(book)}
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
              onClick={executeDelete}
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
