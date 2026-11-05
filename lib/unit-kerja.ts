/**
 * Unit kerja / jenis kegiatan pada website ini datanya semi-terbuka: portal
 * admin punya daftar baku (lihat `docs/supabase-kegiatan-internal.sql`), tetapi
 * nilai bebas dari database tetap diterima dan dinormalisasi agar
 * pengelompokan konsisten (mis. "Seksi P3" dan "seksi  p3" jadi satu unit).
 *
 * `jenis_kegiatan` menyimpan nama lengkap unit ("Pisah Sambut"),
 * `slugnya` dipakai sebagai parameter route (/dokumentasi/[unit]).
 */

export type UnitKerja = {
  slug: string
  nama: string
}

export const unitKerjaCadangan: UnitKerja = {
  slug: "lain-lain",
  nama: "Lain-lain",
}

/** Daftar baku unit kerja / jenis kegiatan kantor. */
export const DAFTAR_UNIT_KERJA: UnitKerja[] = [
  { slug: "pisah-sambut", nama: "Pisah Sambut" },
  { slug: "rapat", nama: "Rapat" },
  { slug: "pelatihan", nama: "Pelatihan" },
  { slug: "sosialisasi", nama: "Sosialisasi" },
  { slug: "perayaan", nama: "Perayaan" },
  { slug: "kunjungan", nama: "Kunjungan" },
  { slug: "bakti-sosial", nama: "Bakti Sosial" },
  { slug: "olahraga", nama: "Olahraga" },
  { slug: "lain-lain", nama: "Lain-lain" },
]

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

  const slug = slugUnitKerja(nama)
  const cocok = DAFTAR_UNIT_KERJA.find((unit) => unit.slug === slug)
  return { slug, nama: cocok?.nama ?? nama }
}
