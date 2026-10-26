import { NextResponse } from "next/server";
import { fetchKegiatan } from "@/lib/supabase";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await fetchKegiatan(500);
    const kegiatan = payload.kegiatan || [];
    const photos = [];
    
    for (let i = 0; i < kegiatan.length; i++) {
      const k = kegiatan[i];
      if (k.fotoUrl) {
        photos.push(k.fotoUrl);
      }
    }
    
    if (photos.length > 0) {
      const items = photos.map((src, idx) => ({
        id: "supabase-" + idx,
        title: kegiatan.find((x: any) => x.fotoUrl === src)?.judul || "Dokumentasi",
        date: kegiatan.find((x: any) => x.fotoUrl === src)?.tanggal || "",
        unit: kegiatan.find((x: any) => x.fotoUrl === src)?.unitKerja || "",
        src: src
      }));
      
      return NextResponse.json({ units: [{ slug: "all", nama: "Semua", kegiatan: [{ id: "all", judul: "Dokumentasi", tanggal: "", deskripsi: "", foto: photos }] }] }, {
        status: 200,
        headers: {
          "Cache-Control": "no-store, must-revalidate"
        }
      });
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
