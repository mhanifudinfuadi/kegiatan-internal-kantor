import { NextResponse } from "next/server"
import { fetchKegiatan } from "@/lib/supabase"

export const dynamic = "force-dynamic"

/**
 * Endpoint JSON publik. Dipakai website untuk memuat ulang daftar kegiatan
 * tanpa melakukan navigasi halaman penuh (mis. /talks-showcase).
 *
 * Query opsional:
 *   ?unit=<slug>   filter satu unit kerja
 *   ?limit=<n>     batas jumlah kegiatan (default 500, maks 1000)
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const unit = params.get("unit")?.trim() || null
  const limitParam = Number(params.get("limit"))
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 1000) : 500

  const payload = await fetchKegiatan(limit)
  const kegiatan = unit ? payload.kegiatan.filter((k) => k.unitKerjaSlug === unit) : payload.kegiatan

  return NextResponse.json(
    { ...payload, kegiatan },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    },
  )
}
