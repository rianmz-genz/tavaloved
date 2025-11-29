// file: components/admin/book-form.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// ... (Interface BookTitle tetap sama di file page.tsx)

interface BookFormProps {
  onSuccess: () => void;
}

const createBook = async (formData: FormData) => {
  // ... (Fungsi createBook tetap sama)
  const response = await fetch("/api/admin/book", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal mengirim data buku.");
  }
  return response.json();
};

export function BookForm({ onSuccess }: BookFormProps) {
  const { data: session } = useSession();
  const adminUserId = session?.user?.id;

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    synopsis: "",
    category: "",
    barcodeSN: "",
    condition: "Baik",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ... (handleChange dan handleFileChange tetap sama)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCoverFile(e.target.files[0]);
    } else {
      setCoverFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... (Logika handleSubmit tetap sama, tapi panggil onSuccess di akhir)
    if (!adminUserId) {
      setError("Error: User Admin ID tidak ditemukan.");
      return;
    }
    if (!coverFile) {
      setError("Cover buku wajib di-upload.");
      return;
    }

    setIsLoading(true);
    setStatus(null);
    setError(null);
    const loadingToastId = toast.loading(
      "Sedang memproses data dan meng-upload file..."
    );
    try {
      const formPayload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formPayload.append(key, value);
      });
      formPayload.append("coverImage", coverFile);
      formPayload.append("ownerId", adminUserId);

      const result = await createBook(formPayload);
      console.log(result);
      setStatus(
        `Buku "${result.title.title}" berhasil ditambahkan! Barcode: ${result.item.barcodeSN}`
      );

      // Panggil onSuccess untuk memberi tahu komponen induk agar me-refresh tabel
      onSuccess();

      // Reset form
      setFormData({
        title: "",
        author: "",
        synopsis: "",
        category: "",
        barcodeSN: "",
        condition: "Baik",
      });
      setCoverFile(null);
      toast.success("Buku Berhasil Disimpan!", {
        description: `Judul: ${result.title.title}, Barcode: ${result.item.barcodeSN}`,
        id: loadingToastId, // Tutup toast loading
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal Menyimpan Data", {
        description: err.message,
        id: loadingToastId, // Tutup toast loading
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => toast.dismiss(loadingToastId), 3000);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Tambah Buku Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {status && (
            <div className="p-4 bg-green-100 text-green-700 rounded-md">
              {status}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <h3 className="text-lg font-semibold border-b pb-2 text-primary">
            Detail Judul (BookTitle)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Buku</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Penulis</Label>
              <Input
                id="author"
                required
                value={formData.author}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                required
                value={formData.category}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Buku (Wajib)</Label>
              <Input
                id="coverImage"
                type="file"
                required
                accept="image/*"
                onChange={handleFileChange}
              />
              {coverFile && (
                <p className="text-xs text-muted-foreground">
                  File dipilih: {coverFile.name}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="synopsis">Sinopsis</Label>
            <Textarea
              id="synopsis"
              value={formData.synopsis}
              onChange={handleChange}
            />
          </div>

          <h3 className="text-lg font-semibold border-b pb-2 pt-4 text-primary">
            Detail Stok Item Awal (BookItem)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcodeSN">Barcode/SN Copy</Label>
              <Input
                id="barcodeSN"
                required
                value={formData.barcodeSN}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Kondisi</Label>
              <Input
                id="condition"
                value={formData.condition}
                onChange={handleChange}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Memproses..." : "Simpan Buku & Tambah Stok Awal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
