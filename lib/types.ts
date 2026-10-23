export type Kegiatan = {
  id: string
  judul: string
  keterangan: string | null
  tanggal: string | null
  unitKerja: string
  unitKerjaSlug: string
  fotoUrl: string | null
  createdAt: string
}

export type KegiatanGroup = {
  slug: string
  nama: string
  kegiatan: Kegiatan[]
}

export type KegiatanPayload = {
  kegiatan: Kegiatan[]
  sumber: "supabase" | "contoh"
  catatan: string | null
}
