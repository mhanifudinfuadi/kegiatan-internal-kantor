import { NextResponse } from "next/server"

const PALET = [
  ["#102b46", "#25405c", "#B66B87"],
  ["#1b3d5b", "#3f5f7d", "#d8a4b8"],
  ["#25283b", "#4b4f63", "#e0b8a0"],
  ["#123c3a", "#2f6a63", "#e2c08a"],
  ["#3a1f2b", "#7c4257", "#f0c9a8"],
  ["#1d2b45", "#4b3f6b", "#b8a5e0"],
  ["#2d3320", "#5c6b3c", "#e5d08a"],
  ["#331f1f", "#7a4038", "#e8b4a0"],
  ["#0f2f4a", "#2f5f7d", "#9fd0e0"],
  ["#3d2a1c", "#7a5a35", "#e8cf9a"],
  ["#221f3d", "#4f4a7d", "#a9b8e8"],
  ["#173a2f", "#3f7a5f", "#c8e0a8"],
]

function nomor(nilai: string) {
  const angka = Number.parseInt(nilai, 10)
  return Number.isFinite(angka) && angka > 0 ? angka : 1
}

/**
 * Menghasilkan foto contoh (SVG) untuk data contoh di website publik.
 * Dipakai hanya ketika Supabase belum dapat dibaca.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ n: string }> },
) {
  const { n } = await context.params
  const index = nomor(n)
  const [gelap, tengah, terang] = PALET[(index - 1) % PALET.length]

  const label = new URL(request.url).searchParams.get("label") ?? "Kegiatan Internal"
  const judul = `Contoh dokumentasi ${String(index).padStart(2, "0")}`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="${judul}">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${gelap}"/>
      <stop offset="55%" stop-color="${tengah}"/>
      <stop offset="100%" stop-color="${terang}"/>
    </linearGradient>
    <radialGradient id="g2" cx="22%" cy="18%" r="62%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0v48" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1600" height="900" fill="url(#g1)"/>
  <rect width="1600" height="900" fill="url(#p)"/>
  <rect width="1600" height="900" fill="url(#g2)"/>
  <circle cx="1280" cy="250" r="260" fill="#ffffff" fill-opacity="0.07"/>
  <circle cx="260" cy="700" r="190" fill="#000000" fill-opacity="0.10"/>
  <text x="96" y="742" font-family="Georgia, 'Times New Roman', serif" font-size="132" font-weight="700" fill="#ffffff" fill-opacity="0.92">${String(index).padStart(2, "0")}</text>
  <text x="96" y="806" font-family="Helvetica, Arial, sans-serif" font-size="40" letter-spacing="6" fill="#ffffff" fill-opacity="0.78">${escapeXml(label.toUpperCase())}</text>
</svg>`

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
