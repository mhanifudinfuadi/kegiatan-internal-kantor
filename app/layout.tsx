import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { fontDisplay, fontBody } from "./layout-fonts";

export const metadata: Metadata = {
  title: "イセリアル — Dokumentasi 087",
  description: "The Dynamic Pulse",
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
      <body>{children}</body>
    </html>
  );
}
