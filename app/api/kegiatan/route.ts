import { NextResponse } from "next/server"
import { fetchKegiatan } from "@/lib/supabase"

export const dynamic = "force-dynamic"

/**
 * Endpoint JSON publik. Dipakai website untuk memuat ulang daftar kegiatan
 * tanpa melakukan navigasi halaman penuh.
 */
export async function GET() {
  const payload = await fetchKegiatan()

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  })
}
