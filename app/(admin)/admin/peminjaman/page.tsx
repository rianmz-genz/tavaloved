// file: app/admin/peminjaman/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// --- Interfaces Data Loan ---
interface LoanItem {
  id: string;
  borrowDate: string;
  dueDate: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "RETURNED";
  user: {
    name: string | null;
    email: string | null;
  };
  item: {
    barcodeSN: string | null;
    title: {
      title: string;
    };
  };
}

// --- FUNGSI FETCH & AKSI API ---

// 1. Fetch Daftar Pinjaman
const fetchLoanRequests = async (): Promise<LoanItem[]> => {
  const response = await fetch("/api/admin/loans");
  if (!response.ok) {
    // Asumsi error handling di server sudah mengembalikan pesan yang bermakna
    const errorText = await response.text();
    throw new Error(errorText || "Gagal memuat permintaan pinjaman.");
  }
  return response.json();
};

// 2. Aksi (APPROVE / REJECT)
const performLoanAction = async (
  loanId: string,
  action: "APPROVE" | "REJECT"
) => {
  const response = await fetch(`/api/admin/loans/${loanId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Gagal ${action === "APPROVE" ? "menyetujui" : "menolak"}.`
    );
  }
  return response.json();
};
// ------------------------------

interface ActionDetails {
  loanId: string;
  bookTitle: string;
  action: "APPROVE" | "REJECT";
}

export default function AdminPeminjamanPage() {
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // State untuk Dialog Konfirmasi
  const [openDialog, setOpenDialog] = useState(false);
  const [actionDetail, setActionDetail] = useState<ActionDetails | null>(null);

  const loadLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLoanRequests();
      setLoans(data);
    } catch (e: any) {
      toast.error("Gagal Memuat Data", { description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  // --- FUNGSI UTAMA UNTUK MENGEKSEKUSI AKSI SETELAH KONFIRMASI ---
  const executeAction = async () => {
    if (!actionDetail) return;

    const { loanId, bookTitle, action } = actionDetail;

    // Tutup dialog
    setOpenDialog(false);

    setActionLoadingId(loanId);
    const actionText = action === "APPROVE" ? "Menyetujui" : "Menolak";
    const loadingToastId = toast.loading(`${actionText} ${bookTitle}...`);

    try {
      // Panggil API Aksi
      await performLoanAction(loanId, action as "APPROVE" | "REJECT");

      toast.success("Aksi Berhasil", {
        description: `Pinjaman ${bookTitle} berhasil di-${
          action === "APPROVE" ? "SETUJUI" : "TOLAK"
        }.`,
      });

      // Refresh daftar
      await loadLoans();
    } catch (error: any) {
      toast.error("Aksi Gagal", { description: error.message });
    } finally {
      setActionLoadingId(null);
      setActionDetail(null);
      setTimeout(() => toast.dismiss(loadingToastId), 3000);
    }
  };
  // -----------------------------------------------------------

  // --- Handler yang Membuka Dialog ---
  const handleActionClick = (loan: LoanItem, action: "APPROVE" | "REJECT") => {
    setActionDetail({
      loanId: loan.id,
      bookTitle: loan.item.title.title,
      action: action,
    });
    setOpenDialog(true);
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const requestedLoans = loans.filter((l) => l.status === "REQUESTED");
  const approvedLoans = loans.filter((l) => l.status === "APPROVED");

  return (
    <>
      <div>
        <h1 className="text-4xl font-medium text-foreground mb-1">
          📋 Manajemen Peminjaman
        </h1>
        <p className="text-muted-foreground mb-8">
          Kelola permintaan pinjaman dari anggota dan lacak buku yang sedang
          dipinjam.
        </p>

        <h2 className="text-3xl font-medium text-primary mb-4">
          Permintaan Baru ({requestedLoans.length})
        </h2>

        <Card className="shadow-lg mb-8">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center p-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />{" "}
                Memuat...
              </div>
            ) : requestedLoans.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">
                Tidak ada permintaan peminjaman baru saat ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      <th className="px-3 py-3">Buku (Item SN)</th>
                      <th className="px-3 py-3">Peminjam</th>
                      <th className="px-3 py-3">Tgl Pinjam</th>
                      <th className="px-3 py-3">Tgl Kembali</th>
                      <th className="px-3 py-3 w-[200px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestedLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-secondary/20">
                        <td className="px-3 py-3 text-sm font-semibold">
                          {loan.item.title.title}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {loan.user.name || loan.user.email}
                          <div className="text-xs text-muted-foreground">
                            {loan.user.email}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {formatDueDate(loan.borrowDate)}
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-destructive">
                          {formatDueDate(loan.dueDate)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={actionLoadingId === loan.id}
                            onClick={() => handleActionClick(loan, "APPROVE")} // Panggil handler Dialog
                          >
                            {actionLoadingId === loan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-1" />
                            )}
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actionLoadingId === loan.id}
                            onClick={() => handleActionClick(loan, "REJECT")} // Panggil handler Dialog
                          >
                            {actionLoadingId === loan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4 mr-1" />
                            )}
                            Tolak
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

        <h2 className="text-3xl font-medium text-foreground mt-10 mb-4">
          Buku Sedang Dipinjam ({approvedLoans.length})
        </h2>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center p-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />{" "}
                Memuat...
              </div>
            ) : approvedLoans.length === 0 ? (
              <p className="text-center text-muted-foreground p-8">
                Tidak ada buku yang sedang dipinjam saat ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      <th className="px-3 py-3">Buku (Item SN)</th>
                      <th className="px-3 py-3">Peminjam</th>
                      <th className="px-3 py-3">Tgl Pinjam</th>
                      <th className="px-3 py-3">Tgl Kembali</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-secondary/20">
                        <td className="px-3 py-3 text-sm font-semibold">
                          {loan.item.title.title}
                          <div className="text-xs text-muted-foreground">
                            SN: {loan.item.barcodeSN}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {loan.user.name || loan.user.email}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {formatDueDate(loan.borrowDate)}
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-destructive">
                          {formatDueDate(loan.dueDate)}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                            DIPINJAM
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {/* TODO: Tambahkan tombol "Tandai Dikembalikan" */}
                          <Button size="sm" variant="outline" disabled>
                            Kembalikan
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

        {/* TODO: Tambahkan bagian untuk riwayat pinjaman (RETURNED/REJECTED) */}
      </div>

      {/* --- KOMPONEN DIALOG KONFIRMASI --- */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              className={`flex items-center ${
                actionDetail?.action === "APPROVE"
                  ? "text-green-600"
                  : "text-destructive"
              }`}
            >
              {actionDetail?.action === "APPROVE" ? (
                <Check className="w-6 h-6 mr-2" />
              ) : (
                <Trash2 className="w-6 h-6 mr-2" />
              )}
              Konfirmasi{" "}
              {actionDetail?.action === "APPROVE" ? "Persetujuan" : "Penolakan"}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Anda yakin ingin **
            {actionDetail?.action === "APPROVE" ? "menyetujui" : "menolak"}**
            permintaan pinjaman untuk buku **"{actionDetail?.bookTitle}"**?
            <p className="mt-2">
              {actionDetail?.action === "APPROVE"
                ? "Dengan menyetujui, status item akan tetap ON_LOAN dan pinjaman menjadi aktif."
                : "Dengan menolak, status pinjaman akan menjadi REJECTED dan item akan kembali berstatus AVAILABLE."}
            </p>
          </DialogDescription>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpenDialog(false)}>
              Batal
            </Button>
            <Button
              variant={
                actionDetail?.action === "APPROVE" ? "default" : "destructive"
              }
              className={
                actionDetail?.action === "APPROVE"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
              onClick={executeAction}
              disabled={actionLoadingId !== null}
            >
              Ya,{" "}
              {actionDetail?.action === "APPROVE"
                ? "Setujui Pinjaman"
                : "Tolak Pinjaman"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
