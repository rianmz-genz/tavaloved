// file: components/layouts/public-navbar.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; // Asumsi kamu punya DropdownMenu dari shadcn

export default function PublicNavbar() {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const isLoading = status === 'loading';

    return (
        // Wrapper Navbar
        <nav className="sticky top-0 z-50 w-full bg-card shadow-md border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Judul Kiri */}
                    <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
                        <Image
                            src="/assets/img/tavaloved.png"
                            alt="TAVALOVEd Library Logo"
                            width={32}
                            height={32}
                            className="rounded-full shadow-sm border border-primary/50"
                            unoptimized
                        />
                        <span className="text-xl font-semibold text-primary hidden sm:inline">
                            Tavaloved
                        </span>
                    </Link>

                    {/* Navigasi Kanan (Login/User) */}
                    <div className="flex items-center space-x-3">
                        {isLoading ? (
                            <div className="h-8 w-20 bg-secondary animate-pulse rounded-full"></div>
                        ) : isAuthenticated ? (
                            
                            // --- USER DROPDOWN ---
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex items-center space-x-2 pr-1">
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-primary/50 text-primary">
                                            {/* Inisial User atau Ikon Default */}
                                            {session.user.name ? session.user.name[0] : <User className='w-5 h-5' />}
                                        </div>
                                        <span className="hidden md:inline font-medium text-sm">
                                            {session.user.name || session.user.email}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className='w-56'>
                                    <DropdownMenuLabel>
                                        {session.user.name || 'Anggota'}
                                        <div className="text-xs text-muted-foreground truncate">
                                            {session.user.email}
                                        </div>
                                    </DropdownMenuLabel>
                                    
                                    <DropdownMenuSeparator />
                                    
                                    {/* Link ke Admin Panel jika Admin */}
                                    {session.user.role === 'ADMIN' && (
                                        <Link href="/admin" passHref>
                                            <DropdownMenuItem className="cursor-pointer font-medium text-primary">
                                                <Menu className='w-4 h-4 mr-2' /> Admin Panel
                                            </DropdownMenuItem>
                                        </Link>
                                    )}

                                    {/* Link ke Dashboard User (jika ada) */}
                                    <Link href="/dashboard" passHref>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <User className='w-4 h-4 mr-2' /> Dashboard Saya
                                        </DropdownMenuItem>
                                    </Link>

                                    <DropdownMenuSeparator />
                                    
                                    <DropdownMenuItem 
                                        onClick={() => signOut()} 
                                        className="cursor-pointer text-destructive focus:bg-destructive/10"
                                    >
                                        <LogOut className='w-4 h-4 mr-2' /> Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                        ) : (
                            // --- TOMBOL LOGIN ---
                            <Button 
                                onClick={() => signIn('email')} 
                                variant="default" 
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <LogIn className="w-4 h-4 mr-2" /> Masuk
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}