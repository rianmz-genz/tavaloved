// file: app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        // SessionProvider membungkus seluruh aplikasi untuk NextAuth hooks
        <SessionProvider>
            {children}
            {/* Toaster di sini agar notifikasi muncul di seluruh app */}
            <Toaster position="top-right" richColors /> 
        </SessionProvider>
    );
}