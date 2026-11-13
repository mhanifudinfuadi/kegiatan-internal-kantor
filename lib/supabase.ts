import { unstable_noStore as noStore } from "next/cache"
import { createClient } from "@supabase/supabase-js"
import { normalisasiUnitKerja } from "@/lib/unit-kerja"
import type { Kegiatan, KegiatanPayload } from "@/lib/types"

/**
 * Sumber data tunggal website publik "Kegiatan Internal Kantor".
 *
 * Data dibaca dari tabel publik `kegiatan_internal_kantor` di Supabase yang sama
 * dengan portal admin utama (madusportupdate). Admin mengunggah foto lewat
 * portal tersebut; website ini hanya membaca.
 *
 * Skema lengkap ada di `docs/supabase-kegiatan-internal.sql`.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  : null

export const DOKUMENTASI_BUCKET = "dokumentasi"
export const INTERNAL_PHOTOS_BUCKET = "kegiatan-internal-kantor-photos"

/** Tabel utama portal admin. */
export const TABEL_KEGIATAN = "kegiatan_internal_kantor"
/** View publik (dibuat oleh skrip SQL). Dipakai lebih dulu bila tersedia. */
export const VIEW_KEGIATAN = "v_kegiatan_internal"

const kolomLengkap =
  "id, judul, sub_judul, jenis_kegiatan, cerita_kegiatan, image_path, image_url, photos, published, created_at, tanggal_kegiatan, kegiatan_internal_photos(id, storage_path, storage_url)"
const kolomTanpaRelasi =
  "id, judul, sub_judul, jenis_kegiatan, cerita_kegiatan, image_path, image_url, photos, published, created_at, tanggal_kegiatan"
const kolomDasar =
  "id, judul, sub_judul, jenis_kegiatan, cerita_kegiatan, image_path, image_url, published, created_at, tanggal_kegiatan"

type StorageFileItem = {
  bucket: string
  name: string
  created_at: string
}

interface ActivityRow extends Record<string, any> {}

function urlPublik(path: string, bucket: string = DOKUMENTASI_BUCKET): string | null {
  if (!supabase) return null
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl || null
}

type FotoEntri = { url: string; time: number }

function waktuDari(nilai: string | null | undefined): number {
  if (!nilai) return 0
  const t = new Date(nilai).getTime()
  return Number.isFinite(t) ? t : 0
}

function pathDariUrl(url: string, bucket: string): string | null {
  if (!url) return null
  const penanda = `/storage/v1/object/public/${bucket}/`
  const idx = url.indexOf(penanda)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + penanda.length).split("?")[0]) || null
}

/**
 * Kumpulkan SEMUA foto milik satu baris kegiatan dari seluruh sumber
 * (`photos` JSONB, relasi `kegiatan_internal_photos`, `image_path`/`image_url`).
 * Tidak ada penyaringan: semua URL yang tercatat akan dikembalikan apa adanya.
 */
function kumpulkanFotoEksplisit(baris: any): FotoEntri[] {
  const hasil: FotoEntri[] = []
  const terlihat = new Set<string>()
  const tambah = (url: string | null | undefined, waktu = 0) => {
    const bersih = (url ?? "").trim()
    if (!bersih || terlihat.has(bersih)) return
    terlihat.add(bersih)
    hasil.push({ url: bersih, time: Number.isFinite(waktu) ? waktu : 0 })
  }

  const waktuBaris = waktuDari(baris.created_at)

  // 1. Kolom photos (JSONB) — bisa berisi string path, URL, atau {path,url}.
  if (Array.isArray(baris.photos)) {
    for (const p of baris.photos) {
      if (typeof p === "string" && p.trim()) {
        const nilai = p.trim()
        tambah(nilai.startsWith("http") ? nilai : urlPublik(nilai), waktuBaris)
      } else if (p && typeof p === "object") {
        const url = typeof p.url === "string" && p.url.trim() ? p.url.trim() : null
        const path = typeof p.path === "string" && p.path.trim() ? p.path.trim() : null
        const bucket = typeof p.bucket === "string" && p.bucket.trim() ? p.bucket.trim() : DOKUMENTASI_BUCKET
        const waktu = waktuDari(p.created_at) || waktuBaris
        tambah(url ?? (path ? urlPublik(path, bucket) : null), waktu)
      }
    }
  }

  // 2. Relasi tabel kegiatan_internal_photos (kalau tersedia).
  if (Array.isArray(baris.kegiatan_internal_photos)) {
    for (const foto of baris.kegiatan_internal_photos as any[]) {
      const url = foto?.storage_url?.trim?.() || null
      const path = foto?.storage_path?.trim?.() || null
      const bucket = foto?.bucket?.trim?.() || DOKUMENTASI_BUCKET
      tambah(url ?? (path ? urlPublik(path, bucket) : null), waktuDari(foto?.created_at) || waktuBaris)
    }
  }

  // 3. Foto utama.
  const utamaUrl = baris.image_url?.trim?.() || null
  const utamaPath = baris.image_path?.trim?.() || null
  tambah(utamaUrl ?? (utamaPath ? urlPublik(utamaPath) : null), waktuBaris)

  return hasil
}

/**
 * Bagi berkas storage menjadi foto yang sudah tertaut ke sebuah kegiatan dan
 * foto "lepas" (belum tertaut ke kegiatan mana pun).
 *
 * Hasilnya dipakai hanya untuk menempatkan foto lepas pada kegiatan yang tepat —
 * tidak ada foto yang dibuang: semua foto tertaut selalu tampil di kegiatannya,
 * dan semua foto lepas tetap tampil (lihat `keKegiatan`).
 */
function pisahkanFotoStorage(barisData: any[], storageFiles: StorageFileItem[]) {
  const tertaut = new Set<string>()
  for (const baris of barisData) {
    for (const entri of kumpulkanFotoEksplisit(baris)) {
      tertaut.add(entri.url)
      for (const bucket of [DOKUMENTASI_BUCKET, INTERNAL_PHOTOS_BUCKET]) {
        const path = pathDariUrl(entri.url, bucket)
        if (path) tertaut.add(urlPublik(path, bucket) ?? "")
      }
    }
  }

  const lepas: FotoEntri[] = []
  const terlihat = new Set<string>()
  for (const f of storageFiles) {
    const url = urlPublik(f.name, f.bucket)
    if (!url || tertaut.has(url) || terlihat.has(url)) continue
    terlihat.add(url)
    lepas.push({ url, time: waktuDari(f.created_at) })
  }

  lepas.sort((a, b) => a.time - b.time)
  return { lepas }
}

/** Kegiatan yang paling dekat waktunya dengan sebuah foto lepas. */
function kegiatanTerdekat(
  waktuFoto: number,
  waktuBaris: Array<{ id: string; time: number }>,
): string | null {
  let terbaik: { id: string; jarak: number } | null = null
  for (const b of waktuBaris) {
    const jarak = Math.abs(b.time - waktuFoto)
    if (!terbaik || jarak < terbaik.jarak) terbaik = { id: b.id, jarak }
  }
  return terbaik?.id ?? null
}

/**
 * Ubah satu baris kegiatan menjadi objek Kegiatan dengan SELURUH fotonya.
 *
 * Semua foto yang diunggah admin ikut tampil — tidak ada pemilihan "foto sampul"
 * saja. Urutan: foto utama → foto tertaut lainnya → foto lepas yang waktunya
 * paling dekat dengan kegiatan ini.
 */
function keKegiatan(
  baris: ActivityRow,
  eksplisit: FotoEntri[],
  lepasUntukBaris: FotoEntri[],
): Kegiatan {
  const unit = normalisasiUnitKerja(baris.jenis_kegiatan ?? baris.sub_judul ?? baris.judul)
  const tanggal = baris.tanggal_kegiatan?.split?.("T")?.[0] ?? baris.created_at?.split?.("T")?.[0] ?? null

  const fotoUrls: string[] = []
  const terlihat = new Set<string>()
  const tambah = (url: string | null | undefined) => {
    const bersih = (url ?? "").trim()
    if (!bersih || terlihat.has(bersih)) return
    terlihat.add(bersih)
    fotoUrls.push(bersih)
  }

  // 1. Foto utama paling depan (bila ada di antara foto tertaut).
  const utamaUrl = baris.image_url?.trim?.() || (baris.image_path?.trim?.() ? urlPublik(baris.image_path.trim()) : null)
  tambah(utamaUrl)

  // 2. Seluruh foto yang tertaut ke kegiatan (urut waktu unggah).
  const urut = [...eksplisit].sort((a, b) => a.time - b.time)
  for (const entri of urut) tambah(entri.url)

  // 3. Foto lepas yang waktunya paling dekat dengan kegiatan ini.
  for (const entri of lepasUntukBaris) tambah(entri.url)

  return {
    id: String(baris.id),
    judul: (baris.judul || "").trim() || "Kegiatan Tanpa Judul",
    subJudul: baris.sub_judul?.trim() || null,
    keterangan: baris.cerita_kegiatan?.trim() ? baris.cerita_kegiatan.trim() : baris.sub_judul?.trim() || null,
    tanggal,
    unitKerja: unit.nama,
    unitKerjaSlug: unit.slug,
    fotoUrl: fotoUrls[0] ?? null,
    fotoUrls,
    createdAt: baris.created_at || "",
  }
}

type QueryHasil = { data: any[] | null; error: { code?: string; message: string } | null }

async function ambilBaris(tabel: string, kolom: string, limit: number): Promise<QueryHasil> {
  if (!supabase) return { data: null, error: { message: "Supabase belum dikonfigurasi" } }
  const { data, error } = await supabase
    .from(tabel)
    .select(kolom)
    .eq("published", true)
    .order("tanggal_kegiatan", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit)
  return { data: (data as any[]) ?? null, error: error ? { code: error.code, message: error.message } : null }
}

/** Kode error PostgREST yang berarti kolom/tabel/relasi belum ada. */
const KODE_SKEMA_BERUBAH = new Set(["42703", "42P01", "PGRST200", "PGRST204", "PGRST205"])

async function ambilSemuaBaris(limit: number): Promise<QueryHasil> {
  // Urutan percobaan: view publik -> tabel + relasi -> tabel tanpa relasi -> kolom dasar.
  const percobaan: Array<[string, string]> = [
    [VIEW_KEGIATAN, kolomLengkap],
    [TABEL_KEGIATAN, kolomLengkap],
    [TABEL_KEGIATAN, kolomTanpaRelasi],
    [TABEL_KEGIATAN, kolomDasar],
  ]

  let hasil: QueryHasil = { data: null, error: { message: "Tidak ada percobaan query" } }
  for (const [tabel, kolom] of percobaan) {
    hasil = await ambilBaris(tabel, kolom, limit)
    if (!hasil.error) return hasil
    if (!KODE_SKEMA_BERUBAH.has(hasil.error.code ?? "")) return hasil
  }
  return hasil
}

/**
 * Ambil semua foto dari kedua bucket storage untuk sinkronisasi penuh.
 *
 * Madusport bisa menggunakan dua bucket:
 * - "dokumentasi": Foto utama dan foto tambahan per kegiatan
 * - "kegiatan-internal-kantor-photos": Foto alternatif atau backup
 *
 * Kedua bucket dibaca penuh agar **semua foto yang diunggah admin** (bukan hanya
 * foto sampul) ikut tampil di website.
 */
async function ambilBerkasStorage(): Promise<StorageFileItem[]> {
  if (!supabase) return []

  const allFiles: StorageFileItem[] = []
  const bucketsToRead = [DOKUMENTASI_BUCKET, INTERNAL_PHOTOS_BUCKET] // Kedua bucket!
  const pageSize = 1000

  for (const bucketName of bucketsToRead) {
    let offset = 0
    try {
      while (true) {
        const storageRes = await supabase.storage.from(bucketName).list("", { limit: pageSize, offset })
        if (storageRes.error || !storageRes.data || storageRes.data.length === 0) break

        for (const f of storageRes.data) {
          allFiles.push({ bucket: bucketName, name: f.name, created_at: f.created_at ?? "" })
        }

        if (storageRes.data.length < pageSize) break
        offset += pageSize
        if (offset > 5000) break // safety cap per bucket
      }
    } catch (err) {
      console.warn(`[kegiatan] membaca bucket ${bucketName} gagal:`, err instanceof Error ? err.message : String(err))
    }
  }

  return allFiles
}

export async function fetchKegiatan(limit = 500): Promise<KegiatanPayload> {
  noStore()
  if (!supabase) {
    return {
      kegiatan: kegiatanContoh(),
      sumber: "contoh",
      catatan:
        "Supabase belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY kosong). Menampilkan data contoh.",
    }
  }

  let hasil: QueryHasil
  try {
    hasil = await ambilSemuaBaris(limit)
  } catch (e: any) {
    console.error("[kegiatan] gagal memuat:", e?.message ?? e)
    return {
      kegiatan: kegiatanContoh(),
      sumber: "contoh",
      catatan: `Data kegiatan belum dapat dibaca dari Supabase (${e?.message ?? e}). Menampilkan data contoh.`,
    }
  }

  if (hasil.error) {
    console.error("[kegiatan] gagal memuat:", hasil.error.message)
    return {
      kegiatan: kegiatanContoh(),
      sumber: "contoh",
      catatan: `Data kegiatan belum dapat dibaca dari Supabase (${hasil.error.message}). Menampilkan data contoh.`,
    }
  }

  const barisData = hasil.data ?? []
  const storageFiles = await ambilBerkasStorage()

  // Foto yang sudah tertaut ke kegiatan tetap di kegiatannya; foto yang belum
  // tertaut ditempatkan ke kegiatan dengan waktu unggah terdekat. Tidak ada
  // foto yang dibuang, jadi semua unggahan admin ikut tampil.
  const { lepas } = pisahkanFotoStorage(barisData, storageFiles)
  const waktuBaris = barisData
    .map((b) => ({ id: String(b.id), time: waktuDari(b.created_at) }))
    .filter((b) => b.time > 0)

  const lepasPerBaris = new Map<string, FotoEntri[]>()
  for (const foto of lepas) {
    const id = kegiatanTerdekat(foto.time, waktuBaris)
    if (!id) continue
    const daftar = lepasPerBaris.get(id) ?? []
    daftar.push(foto)
    lepasPerBaris.set(id, daftar)
  }

  const kegiatan = barisData.map((b) =>
    keKegiatan(b, kumpulkanFotoEksplisit(b), lepasPerBaris.get(String(b.id)) ?? []),
  )

  return { kegiatan, sumber: "supabase", catatan: null }
}

function kegiatanContoh(): Kegiatan[] {
  const contoh: Array<{
    judul: string
    keterangan: string
    tanggal: string
    unit: string
    foto: number
  }> = [
      {
        judul: "Rapat Koordinasi Triwulan Seluruh Unit Kerja",
        keterangan:
          "Evaluasi capaian kegiatan semester berjalan dan penyelarasan program antar unit kerja.",
        tanggal: "2026-09-18",
        unit: "Rapat",
        foto: 1,
      },
      {
        judul: "Pemeliharaan Server dan Arsip Digital Kantor",
        keterangan:
          "Pemindahan data arsip kegiatan ke penyimpanan terpusat dan pencadangan perangkat ruang rapat.",
        tanggal: "2026-08-27",
        unit: "Lain-lain",
        foto: 2,
      },
      {
        judul: "Pelatihan Standar Keselamatan Kerja dan K3",
        keterangan:
          "Sosialisasi standar keselamatan kerja dan pemeriksaan perangkat proteksi diri.",
        tanggal: "2026-08-12",
        unit: "Pelatihan",
        foto: 3,
      },
      {
        judul: "Rekonsiliasi Anggaran Tahunan Unit Kerja",
        keterangan:
          "Penyesuaian pagu anggaran operasional dengan rencana kegiatan bulan berikutnya.",
        tanggal: "2026-07-30",
        unit: "Rapat",
        foto: 4,
      },
      {
        judul: "Penataan Ulang Ruang Kerja dan Aset Kantor",
        keterangan:
          "Pelabelan aset, penataan arsip, dan penataan ulang ruang rapat utama.",
        tanggal: "2026-07-09",
        unit: "Lain-lain",
        foto: 5,
      },
    ]

  return contoh.map((item, index) => {
    const unit = normalisasiUnitKerja(item.unit)
    const fotoUrl = `/api/contoh-foto/${item.foto}?label=${encodeURIComponent(unit.nama)}`
    return {
      id: `contoh-${index + 1}`,
      judul: item.judul,
      subJudul: null,
      keterangan: item.keterangan,
      tanggal: item.tanggal,
      unitKerja: unit.nama,
      unitKerjaSlug: unit.slug,
      fotoUrl,
      fotoUrls: [fotoUrl],
      createdAt: `${item.tanggal}T08:00:00.000Z`,
    }
  })
}

const serviceUrl = process.env.SUPABASE_SERVICE_ROLE_URL ?? url
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const isSupabaseAdminConfigured = Boolean(serviceUrl && serviceKey)

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(serviceUrl as string, serviceKey as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  : null
