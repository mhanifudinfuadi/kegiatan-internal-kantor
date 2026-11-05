import type { MetadataRoute } from "next";
import { fetchKegiatan } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kegiatan-internal-kantor.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statis: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/dokumentasi`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/dokumentasi-showcase`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/galeri`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/talks-showcase`, changeFrequency: "weekly", priority: 0.7 },
  ];

  let unit: MetadataRoute.Sitemap = [];
  try {
    const { kegiatan } = await fetchKegiatan(500);
    const slugs = Array.from(new Set(kegiatan.map((k) => k.unitKerjaSlug)));
    unit = slugs.map((slug) => ({
      url: `${BASE}/dokumentasi/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    unit = [];
  }

  return [...statis, ...unit];
}
