import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { fontDisplay, fontBody } from "./layout-fonts";
import { Toaster } from "@/components/ui/toaster";
import AudioPlayer from "@/components/AudioPlayer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kegiatan-internal-kantor.vercel.app"),
  title: {
    default: "イセリアル — Dokumentasi 087",
    template: "%s | Kegiatan Internal Kantor",
  },
  description: "Arsip dokumentasi kegiatan internal kantor Madu Jakbar Sport.",
  openGraph: {
    title: "イセリアル — Dokumentasi 087",
    description: "Arsip dokumentasi kegiatan internal kantor Madu Jakbar Sport.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" style={{ "--font-display": fontDisplay, "--font-body": fontBody } as CSSProperties}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500&family=Zen+Kaku+Gothic+New:wght@300;400;500;700&display=swap"
        />
        {/* Preload subjek agar muncul tanpa jeda */}
        <link rel="preload" as="image" href="/assets/hero/sakura-hero.webp" />
      </head>
      <body>
        {children}
        <Toaster />
        <AudioPlayer />
      </body>
    </html>
  );
}
