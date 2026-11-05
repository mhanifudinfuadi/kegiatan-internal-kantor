import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Unggah Dokumentasi — Kegiatan Internal Kantor",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
