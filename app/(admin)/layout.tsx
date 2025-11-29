import AdminLayout from "@/components/layouts/admin-layout";

export default function AdminLayoutPage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminLayout>{children}</AdminLayout>;
}
