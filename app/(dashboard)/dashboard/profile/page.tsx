// file: app/dashboard/profile/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  User,
  Save,
  Printer,
  BookOpen,
  LogIn,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

// --- Import Library SVG QR Code ---
import QRCode from "react-qr-code";
// --- Import Library HTML to Image ---
import { toPng } from "html-to-image";
import { Options } from "html-to-image/lib/types";
// ------------------------------------------

// --- Interfaces (TETAP SAMA) ---
interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  nomorHp: string | null;
  totalBooksFinished: number;
  image: string | null;
}

// --- FUNGSI FETCH PROFILE DARI API GET (TETAP SAMA) ---
const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await fetch("/api/dashboard/profile");
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal memuat data profil.");
  }
  return response.json();
};
// --------------------------------------------------------

export default function UserProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null); // Ref untuk Kartu Perpus
  const [cacheKey, setCacheKey] = useState(Date.now()); // Anti-Cache Key

  // --- Ambil Data User dari API GET saat login ---
  const loadProfile = useCallback(async () => {
    if (status !== "authenticated") return;
    setIsProfileLoading(true);
    try {
      const data = await fetchUserProfile();
      setUserData(data);
    } catch (error: any) {
      toast.error("Gagal Memuat Profil", { description: error.message });
      setUserData(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  // ------------------------------------------------

  // --- Handler File Change (TETAP SAMA) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hapus URL blob lama untuk menghindari kebocoran memori (penting!)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setNewImageFile(file);
      // Membuat URL blob baru
      setImagePreview(URL.createObjectURL(file));
    } else {
      setNewImageFile(null);
      setImagePreview(null);
    }
  };
  
  // Tambahkan cleanup saat komponen di-unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // --- Handler Update Profile (TETAP SAMA) ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || isSaving) return;

    setIsSaving(true);
    const loadingToastId = toast.loading("Menyimpan perubahan profil...");

    try {
      const formData = new FormData();
      formData.append("name", userData.name || "");
      formData.append("nomorHp", userData.nomorHp || "");

      if (newImageFile) {
        formData.append("image", newImageFile);
      }

      const response = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengupdate profil.");
      }

      await updateSession({
        user: {
          name: result.user.name,
        },
      });

      setUserData(result.user);
      setCacheKey(Date.now());
      setNewImageFile(null);
      // Hapus URL blob setelah upload berhasil
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);

      const fileInput = document.getElementById(
        "image-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      toast.success("Profil Berhasil Diperbarui!", {
        description: "Data dan foto profil telah diperbarui.",
      });
    } catch (error: any) {
      toast.error("Gagal Menyimpan", { description: error.message });
    } finally {
      setIsSaving(false);
      toast.dismiss(loadingToastId);
    }
  };

  // --- Handler Download Kartu (MENGGUNAKAN HTML-TO-IMAGE) ---
  const handleDownload = async () => {
    if (cardRef.current) {
      toast.loading("Membuat gambar kartu...", { id: "download-toast" });

      // --- PERBAIKAN: Tambahkan opsi fontFaces ---
      const options: Options = {
        cacheBust: true,
        skipFonts: true,
        backgroundColor: "#FFEEEE",
        filter: (node: HTMLElement) => {
          // Perlu dilakukan karena kadang ada elemen yang memicu error
          return node.tagName !== "canvas"; // Abaikan elemen canvas jika ada
        },
        pixelRatio: 2.0, // Sertakan definisi font kustom Anda
      };

      // Jika Anda menggunakan Google Fonts melalui <link>, coba gunakan empty array
      // options = { cacheBust: true, pixelRatio: 2.0 };
      // Atau: Anda bisa coba menghilangkan fontFaces jika font Anda di-load di globals.css

      // --- Eksekusi toPng dengan opsi ---
      toPng(cardRef.current, options)
        .then(function (dataUrl) {
          // ... (Logika download file tetap sama)
          const link = document.createElement("a");
          link.download = `kartu-perpus-${userData!.id.substring(0, 8)}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success("Download Selesai", {
            description: "Kartu Anggota berhasil diunduh.",
            id: "download-toast",
          });
        })
        .catch(function (error) {
          console.error("Error converting HTML to image (Font Error):", error);
          toast.error("Gagal Mengunduh", {
            description: `Kesalahan Font: Cek URL font kustom Anda. Error: ${error.message}`,
            id: "download-toast",
          });
        });
    }
  };

  // --- Handler Print Kartu (TETAP SAMA) ---
  const handlePrint = () => {
    if (cardRef.current) {
      const printContent = cardRef.current as HTMLElement;
      const originalContents = document.body.innerHTML;

      const stylesheets = Array.from(document.styleSheets)
        .map((sheet) => sheet.href)
        .filter((href) => href)
        .map((href) => `<link rel="stylesheet" href="${href}">`)
        .join("");

      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write(
          `<html><head><title>Kartu Anggota</title>${stylesheets}</head><body>`
        );
        printWindow.document.write(printContent.outerHTML);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.print();
      } else {
        toast.error("Gagal Mencetak", {
          description: "Browser memblokir jendela pop-up.",
        });
      }
    }
  };

  if (status === "loading" || isProfileLoading) {
    return (
      <div className="text-center p-20">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /> Memuat
        Data Profil...
      </div>
    );
  }

  if (status === "authenticated" && !userData) {
    return (
      <div className="text-center p-20 text-xl text-destructive">
        Gagal memuat data profil lengkap dari server.
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center p-20">
        <p className="text-xl text-destructive mb-4">
          Anda harus login untuk mengakses profile.
        </p>
        <Button onClick={() => signIn("email")} size="lg">
          <LogIn className="w-5 h-5 mr-2" /> Masuk ke Akun Anda
        </Button>
      </div>
    );
  }

  // URL untuk gambar yang sudah tersimpan (tanpa preview)
  const savedAvatarUrl = userData!.image;
  // Tambahkan anti-cache key HANYA pada gambar yang tersimpan.
  const finalSavedAvatarSrc = savedAvatarUrl
    ? `${savedAvatarUrl}?t=${cacheKey}`
    : null;
    
  // URL yang akan ditampilkan (prioritas: Preview > Gambar Tersimpan)
  const displayAvatarSrc = imagePreview || finalSavedAvatarSrc;

  const publicUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  }/user/${userData!.id}`;
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-semibold text-foreground mb-1">
        Pengaturan Profil
      </h1>
      <p className="text-muted-foreground mb-8">
        Atur informasi pribadi Anda dan kelola Kartu.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- 1. KARTU PERPUSTAKAAN (Library Card) --- */}
        <div className="lg:col-span-2">
          <Card className="shadow-2xl border-primary/50">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-xl text-primary">
                Kartu Anggota
              </CardTitle>
              <div className="space-x-2">
                <Button onClick={handlePrint} size="sm" variant="outline">
                  <Printer className="w-4 h-4 mr-2" /> Cetak
                </Button>
                <Button onClick={handleDownload} size="sm" variant="default">
                  <Download className="w-4 h-4 mr-2" /> Unduh PNG
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* --- Desain Kartu (Menggunakan Ref untuk Print/Download) --- */}
              <div
                ref={cardRef}
                className="w-full h-auto rounded-xl p-6 bg-linear-to-br from-primary/10 to-secondary/30 text-foreground shadow-xl border border-primary/20 print:shadow-none print:border-none print:p-4"
                style={{ maxWidth: "400px" }} // Maksimal lebar kartu
              >
                <div className="flex justify-between items-start mb-4">
                  {/* LOGO SAJA */}
                  <div className="flex items-center space-x-2">
                    <Image
                      src="/assets/img/tavaloved.webp"
                      alt="TAVALOVEd Library Logo"
                      width={32}
                      height={32}
                      className="rounded-full shadow-md border border-primary/50"
                      unoptimized
                    />
                  </div>
                  <p className="text-xs text-zinc-600">
                    Anggota Sejak: {new Date().getFullYear()}
                  </p>
                </div>

                <div className="flex justify-between items-end">
                  {/* Data User */}
                  <div>
                    <p className="text-lg font-semibold uppercase">
                      {userData!.name || "Nama Belum Diisi"}
                    </p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {userData!.email}
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                      ID Anggota: {userData!.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {/* QR Code (SVG Rendered) */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-white p-1 flex items-center justify-center border border-zinc-300">
                      <QRCode
                        value={publicUrl}
                        size={90}
                        level="H"
                        viewBox={`0 0 90 90`}
                      />
                    </div>
                    <p className="text-xs mt-1 text-center font-medium">
                      Kode Anggota
                    </p>
                  </div>
                </div>

                <Separator className="my-4 print:my-2" />

                <div className="flex justify-between items-center">
                  <div className="text-sm text-primary flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" /> Ditamatkan:{" "}
                    {userData!.totalBooksFinished}
                  </div>
                  <p className="text-xs text-zinc-500">Perpustakaan Digital</p>
                </div>
              </div>
              {/* --- Akhir Desain Kartu --- */}
            </CardContent>
          </Card>
        </div>

        {/* --- 2. FORM UPDATE PROFILE (TETAP SAMA) --- */}
        <Card className="lg:col-span-1 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Update Informasi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* --- INPUT IMAGE (Perubahan di Sini) --- */}
              <div className="flex flex-col items-center space-y-3 pb-2">
                <div className="relative w-24 h-24 rounded-full bg-secondary border-2 border-primary/50 shadow-inner overflow-hidden">
                  {/* Logika Display Avatar yang Sudah Dipisahkan */}
                  {displayAvatarSrc ? (
                    // Cek apakah ini URL blob (Preview) atau URL biasa (Gambar Tersimpan)
                    imagePreview ? (
                      // Jika ada imagePreview (blob:), pakai tag <img> biasa
                      <img
                        src={imagePreview}
                        alt="User Avatar Preview"
                        className="w-full h-full object-cover z-0"
                      />
                    ) : (
                      // Jika tidak ada imagePreview, pakai Next.js Image Component
                      <Image
                        src={finalSavedAvatarSrc!} // finalSavedAvatarSrc pasti ada di sini
                        alt="User Avatar Saved"
                        fill
                        style={{ objectFit: 'cover' }} // Pindahkan objectFit ke style
                        className="z-0"
                        unoptimized
                      />
                    )
                  ) : (
                    // Avatar default jika tidak ada gambar
                    <div className="w-full h-full flex items-center justify-center text-primary">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                  {/* Overlay */}
                  <label
                    htmlFor="image-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-10 text-white text-xs"
                  >
                    Ganti Foto
                  </label>
                </div>
                <Input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Max 2MB, JPG/PNG
                </p>
              </div>
              {/* -------------------- */}

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="ex: John Doe"
                  value={userData!.name || ""}
                  onChange={(e) =>
                    setUserData((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Tidak Dapat Diubah)</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData!.email || ""}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomorHp">Nomor WA</Label>
                <Input
                  id="nomorHp"
                  type="text"
                  pattern="^\+62[0-9]{9,13}$"
                  required
                  value={userData!.nomorHp || ""}
                  onChange={(e) =>
                    setUserData((prev) =>
                      prev ? { ...prev, nomorHp: e.target.value } : null
                    )
                  }
                  placeholder="ex: +6281234567890"
                />
              </div>

              <Button type="submit" className="w-full mt-4" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}