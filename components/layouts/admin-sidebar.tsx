// file: components/layouts/admin-sidebar.tsx

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, Users, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils" // Asumsikan kamu punya utility class cn

const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Master Buku", href: "/admin/master-buku", icon: BookOpen },
    { name: "Peminjaman", href: "/admin/peminjaman", icon: BookOpen }, // Contoh rute lain
    { name: "Manajemen User", href: "/admin/users", icon: Users },
    { name: "Galang Dana", href: "/admin/dana", icon: DollarSign },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col space-y-4 p-4 h-full border-r bg-card shadow-md">
            <h2 className="text-xl font-bold text-primary mb-4 border-b pb-2">Admin Panel</h2>
            <nav className="flex flex-col space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link 
                            key={item.name} 
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md font-semibold"
                                    : "text-foreground/70 hover:bg-secondary/50 hover:text-foreground"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}