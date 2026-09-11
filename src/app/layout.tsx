import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HoldableGlobalListener } from "@/components/HoldableGlobalListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Untan Research Hub",
  description: "Katalog publikasi riset Tugas Akhir mahasiswa Rekayasa Sistem Komputer & Sistem Informasi FMIPA Universitas Tanjungpura.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <HoldableGlobalListener />
        {children}
      </body>
    </html>
  );
}
