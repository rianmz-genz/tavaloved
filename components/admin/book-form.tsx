// file: components/admin/book-form.tsx

import { useState, useEffect } from "react"; // Tambahkan useEffect
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

// --- Interface untuk User (Pemilik) ---
interface SimpleUser {
    id: string;
    name: string | null;
    email: string | null;
}

// --- Fetch User untuk Dropdown ---
const fetchUsers = async (): Promise<SimpleUser[]> => {
    // Diasumsikan kamu akan membuat API khusus untuk mendapatkan user pemilik item (setidaknya kontributor/admin)
    // Untuk sementara, kita pakai endpoint dummy. Kamu harus buat /api/users
    const response = await fetch('/api/users'); 
    if (!response.ok) {
        console.error('Gagal mengambil daftar user pemilik.');
        return [];
    }
    return response.json();
};

const createBook = async (formData: FormData) => {
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

interface BookFormProps {
  onSuccess: () => void;
}

export function BookForm({ onSuccess }: BookFormProps) {
  const { data: session } = useSession();
  
  // Ambil ID admin yang sedang login sebagai default owner
  const defaultOwnerId = session?.user?.id || ''; 

  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    synopsis: "",
    categories: "", // GANTI: category -> categories (string dipisahkan koma)
    barcodeSN: "",
    condition: "Baik",
    ownerId: defaultOwnerId, // TAMBAH: State untuk ownerId
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Load User Pemilik ---
  useEffect(() => {
    const loadUsers = async () => {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
      // Set ownerId ke user yang sedang login jika ada di daftar user
      if (defaultOwnerId && fetchedUsers.some(u => u.id === defaultOwnerId)) {
        setFormData(prev => ({ ...prev, ownerId: defaultOwnerId }));
      }
    };
    loadUsers();
  }, [defaultOwnerId]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id === 'category' ? 'categories' : id]: value })); // Handle perubahan nama state
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, ownerId: value }));
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
    
    if (!formData.ownerId) {
        toast.error("Validasi Gagal", { description: "Pemilik Item wajib dipilih." });
        return;
    }
    if (!coverFile) {
        setError("Cover buku wajib di-upload.");
        return;
    }

    setIsLoading(true);
    setError(null);
    const loadingToastId = toast.loading(
      "Sedang memproses data dan meng-upload file..."
    );
    try {
      const formPayload = new FormData();
      
      // Kirim semua field teks, categories dikirim sebagai string 'category'
      formPayload.append("title", formData.title);
      formPayload.append("author", formData.author);
      formPayload.append("synopsis", formData.synopsis);
      formPayload.append("category", formData.categories); // PENTING: kirim sebagai 'category'
      formPayload.append("barcodeSN", formData.barcodeSN);
      formPayload.append("condition", formData.condition);
      formPayload.append("ownerId", formData.ownerId);

      formPayload.append("coverImage", coverFile);

      const result = await createBook(formPayload);
      
      onSuccess();
      
      // Reset form
      setFormData({
        title: "",
        author: "",
        synopsis: "",
        categories: "",
        barcodeSN: "",
        condition: "Baik",
        ownerId: defaultOwnerId, // Reset ke default owner
      });
      setCoverFile(null);
      toast.success("Buku Berhasil Disimpan!", {
        description: `Judul: ${result.title.judul}, Barcode: ${result.item.barcode_sn}`,
        id: loadingToastId,
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal Menyimpan Data", {
        description: err.message,
        id: loadingToastId,
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
          {error && (
            <div className="p-3 bg-red-100 text-destructive border border-destructive/20 rounded-md text-sm">
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
              <Label htmlFor="categories">Kategori (Pisahkan dengan koma, cth: Fiksi, Sains)</Label>
              <Input
                id="categories"
                required
                value={formData.categories}
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
            {/* TAMBAH INPUT PEMILIK */}
             <div className="space-y-2">
              <Label htmlFor="ownerId">Pemilik Item</Label>
               <Select value={formData.ownerId} onValueChange={handleSelectChange} required>
                <SelectTrigger id="ownerId">
                  <SelectValue placeholder="Pilih pemilik item" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Biasanya admin/kontributor yang terdaftar.</p>
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