/**
 * Unit kerja pada website ini datanya bebas (bukan daftar tertutup): admin
 * bebas mengisi nama unit kerja saat mengunggah dokumentasi, dan website
 * mengelompokkan berdasarkan nilai yang tersimpan.
 *
 * Yang tetap dijaga di sini adalah normalisasi nama menjadi slug supaya
 * pengelompokan konsisten (mis. "Seksi P3" dan "seksi  p3" jadi satu unit).
 */

export type UnitKerja = {
  slug: string
  nama: string
}

export const unitKerjaCadangan: UnitKerja = {
  slug: "lain-lain",
  nama: "Lain-lain",
}

export function slugUnitKerja(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || unitKerjaCadangan.slug
  )
}

/**
 * Terjemahkan nilai bebas dari database menjadi unit kerja yang seragam.
 */
export function normalisasiUnitKerja(value: string | null | undefined): UnitKerja {
  const nama = (value ?? "").trim().replace(/\s+/g, " ")
  if (!nama) return { ...unitKerjaCadangan }

  return { slug: slugUnitKerja(nama), nama }
}
