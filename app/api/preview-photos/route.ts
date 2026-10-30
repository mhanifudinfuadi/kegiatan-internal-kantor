import { NextResponse } from "next/server";
import { fetchKegiatan } from "@/lib/supabase";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await fetchKegiatan(500);
    const kegiatan = payload.kegiatan || [];
    const photos: string[] = [];
    const items: Array<{ id: string; title: string; date: string; unit: string; src: string; tag: string }> = [];

    for (let i = 0; i < kegiatan.length; i++) {
      const k = kegiatan[i];
      const urls = (k.fotoUrls && k.fotoUrls.length > 0)
        ? k.fotoUrls
        : (k.fotoUrl ? [k.fotoUrl] : []);

      for (let j = 0; j < urls.length; j++) {
        const src = urls[j];
        if (src && !photos.includes(src)) {
          photos.push(src);
          items.push({
            id: `kegiatan-${k.id}-${j}`,
            title: urls.length > 1 ? `${k.judul} (#${j + 1})` : k.judul,
            date: k.tanggal || "",
            unit: k.unitKerja || "",
            src: src,
            tag: (k.unitKerja || "DOKUMENTASI").toUpperCase(),
          });
        }
      }
    }

    if (photos.length > 0) {
      return NextResponse.json(
        {
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
  } catch (e) {}
  
  try {
    const html = readFileSync(join(process.cwd(), "preview dokumentasi.html"), "utf8");
    const photos = [];
    const phMatch = html.match(/--ph-big:url\((data:image\/[^)]+)\)/);
    if (phMatch) {
      const cellMatches = html.match(/data-idx="[0-9]+"/g);
      const count = cellMatches ? cellMatches.length : 5;
      for (let i = 0; i < count; i++) {
        photos.push(phMatch[1]);
      }
    }
    if (photos.length === 0) {
      const dataUriRegex = /url\((data:image\/[^)]+)\)/g;
      let match;
      const seen = new Set();
      while ((match = dataUriRegex.exec(html)) !== null) {
        if (!seen.has(match[1])) {
          seen.add(match[1]);
          photos.push(match[1]);
        }
      }
    }
    
    return NextResponse.json({ units: [{ slug: "all", nama: "Semua", kegiatan: [{ id: "all", judul: "Dokumentasi", tanggal: "", deskripsi: "", foto: photos }] }] }, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, must-revalidate"
      }
    });
  } catch (e) {
    return NextResponse.json({ units: [] }, { status: 200 });
  }
}
