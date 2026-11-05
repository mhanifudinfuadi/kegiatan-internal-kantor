import { NextResponse } from "next/server";
import { fetchKegiatan } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Endpoint ringkas untuk showcase: daftar seluruh foto + metadata.
 * Sumber: /dokumentasi-showcase dan widget preview foto.
 */
export async function GET() {
  const payload = await fetchKegiatan(500);
  const kegiatan = payload.kegiatan || [];
  const photos: string[] = [];
  const items: Array<{ id: string; title: string; date: string; unit: string; src: string; tag: string }> = [];

  for (const k of kegiatan) {
    const urls = (k.fotoUrls && k.fotoUrls.length > 0)
      ? k.fotoUrls
      : (k.fotoUrl ? [k.fotoUrl] : []);

    for (let j = 0; j < urls.length; j++) {
      const src = urls[j];
      if (!src) continue;
      photos.push(src);
      items.push({
        id: `kegiatan-${k.id}-${j}`,
        title: urls.length > 1 ? `${k.judul} (#${j + 1})` : k.judul,
        date: k.tanggal || "",
        unit: k.unitKerja || "",
        src,
        tag: (k.unitKerja || "DOKUMENTASI").toUpperCase(),
      });
    }
  }

  return NextResponse.json(
    {
      sumber: payload.sumber,
      catatan: payload.catatan,
      total: photos.length,
      units: [
        {
          slug: "all",
          nama: "Semua",
          kegiatan: [
            {
              id: "all",
              judul: "Dokumentasi",
              tanggal: "",
              deskripsi: "",
              foto: photos,
            },
          ],
        },
      ],
      items,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    },
  );
}
