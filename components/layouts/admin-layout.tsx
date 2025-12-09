// file: components/layouts/admin-layout.tsx

"use client";
import AdminSidebar from "./admin-sidebar"; // Import sidebar
import { ScrollArea } from "@/components/ui/scroll-area"; // Asumsikan kamu punya ScrollArea
import { Fragment } from "react/jsx-runtime";

const AdminLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <Fragment>
      <div className="flex min-h-screen bg-secondary/30">
        {/* Sidebar - lebar tetap */}
        <div className="w-64 shrink-0">
          <AdminSidebar />
        </div>

        {/* Main Content - mengambil sisa lebar */}
        <main className="grow p-4 md:p-8">
          <ScrollArea className="h-[calc(100vh-64px)]">{children}</ScrollArea>
        </main>
      </div>
    </Fragment>
  );
};

export default AdminLayout;
