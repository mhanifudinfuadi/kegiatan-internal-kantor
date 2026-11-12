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
  name: string
  created_at: string
}

/** Selisih waktu maksimum (ms) antara baris kegiatan dan batch unggahan foto. */
const JENDELA_BATCH_MS = 180_000 // 30 menit (lebih fleksibel untuk handle upload bertahap)

interface ActivityRow extends Record<string, any> {}

function urlPublik(path: string): string | null {
  if (!supabase) return null
  return supabase.storage.from(DOKUMENTASI_BUCKET).getPublicUrl(path).data.publicUrl || null
}

function ekstrakFotoDariBaris(baris: any): string[] {
  const list: string[] = []

  // 1. Kolom photos (JSONB) jika ada
  if (Array.isArray(baris.photos)) {
    for (const p of baris.photos) {
      if (typeof p === "string" && p.trim()) {
        const nilai = p.trim()
        list.push(nilai.startsWith("http") ? nilai : urlPublik(nilai) ?? nilai)
      } else if (p && typeof p === "object") {
        if (typeof p.url === "string" && p.url.trim()) {
          list.push(p.url.trim())
        } else if (typeof p.path === "string" && p.path.trim()) {
          const url = urlPublik(p.path.trim())
          if (url) list.push(url)
        }
      }
    }
  }

  // 2. Relasi tabel kegiatan_internal_photos jika ada
  if (Array.isArray(baris.kegiatan_internal_photos) && baris.kegiatan_internal_photos.length > 0) {
    for (const foto of baris.kegiatan_internal_photos) {
      if (foto?.storage_url?.trim()) {
        list.push(foto.storage_url.trim())
      } else if (foto?.storage_path?.trim()) {
        const url = urlPublik(foto.storage_path.trim())
        if (url) list.push(url)
      }
    }
  }

  // 3. Foto utama jika belum masuk
  let primaryUrl: string | null = null
  if (baris.image_url?.trim()) {
    primaryUrl = baris.image_url.trim()
  } else if (baris.image_path?.trim()) {
    primaryUrl = urlPublik(baris.image_path.trim())
  }
  if (primaryUrl && !list.includes(primaryUrl)) {
    list.unshift(primaryUrl)
  }

  return list
}

/**
 * Cocokkan berkas di bucket dengan baris kegiatan berdasarkan waktu unggah.
 * Portal admin mengunggah semua foto satu kegiatan dalam satu batch, sehingga
 * berkas yang dibuat dalam jendela waktu yang sama milik kegiatan tersebut.
 * Bila beberapa kegiatan berdekatan, berkas diberikan ke kegiatan terdekat.
 */
function pilihBatchStorage(
  storageFiles: StorageFileItem[],
  semuaBaris: any[],
): StorageFileItem[] {
  const baris: ActivityRow = {};
  const rowTime = baris.created_at ? new Date(baris.created_at).getTime() : 0
  if (!rowTime) return []

  const waktuBaris = semuaBaris
    .map((b) => ({ id: b.id, time: b.created_at ? new Date(b.created_at).getTime() : 0 }))
    .filter((b) => b.time > 0)

  // Portal admin mengunggah foto lebih dulu, lalu menyimpan baris kegiatan
  // beberapa detik kemudian. Jadi berkas milik kegiatan ini adalah berkas yang
  // dibuat SEBELUM created_at baris (dalam jendela waktu), bukan sesudahnya.
  const kandidat = storageFiles.filter((f) => {
    const fileTime = new Date(f.created_at).getTime()
    const selisih = rowTime - fileTime
    return selisih >= -5_000 && selisih <= JENDELA_BATCH_MS
  })

  return kandidat
    .filter((f) => {
      const fileTime = new Date(f.created_at).getTime()
      // Berkas milik kegiatan lain yang lebih dekat waktunya.
      const terdekat = waktuBaris.reduce(
        (best, b) => (Math.abs(b.time - fileTime) < Math.abs(best.time - fileTime) ? b : best),
        { id: baris.id, time: rowTime },
      )
      return terdekat.id === baris.id
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

/**
 * Cocokkan foto dari bucket storage dengan baris kegiatan.
 *
 * Strategi matching (urutan prioritas):
 * 1. Bucket "dokumentasi" + "kegiatan-internal-kantor-photos" (timestamp matching ±30 menit)
 * 2. Relasi tabel `kegiatan_internal_photos` (jika ada di database)
 * 3. Foto utama: `image_url` atau `image_path` dari baris kegiatan
 * 4. Fallback pattern matching filename (kecuali bucket matching gagal)
 *
 * Catatan: Semua foto dalam satu kegiatan bisa terkontribusikan dari bucket storage,
 * tidak hanya dari relasi tabel. Jika bucket matching berhasil, semua foto batch
 * akan di-contribute ke fotoUrls untuk ditampilkan pada halaman dokumentasi.
 */
function keKegiatan(baris: ActivityRow, storageFiles: StorageFileItem[], semuaBaris: any[]): Kegiatan {
  const unit = normalisasiUnitKerja(baris.jenis_kegiatan ?? baris.sub_judul ?? baris.judul)

  // Kontribusikan foto dari bucket storage (prioritas #1 dan #4)
  let bucketPhotos: string[] = []

  // Bucket matching dengan timestamp ±30 menit
  if (storageFiles.length > 0 && Object.keys(baris).length > 0) {
    const batch = pilihBatchStorage(storageFiles, semuaBaris)
    if (batch.length > 0) {
      const primaryPath = (baris.image_path || "").trim()
      const primaryUrl = urlPublik(primaryPath)
      const batchUrls: string[] = batch.map((f) => urlPublik(f.name)).filter(Boolean as any)

      // Foto utama (jika ada) diletakkan paling depan, lalu semua foto lainnya berurutan
      if (primaryUrl) {
        const idx = batchUrls.indexOf(primaryUrl)
        if (idx > 0) {
          const [first] = batchUrls.splice(idx, 1)
          bucketPhotos.unshift(first as string)
        } else {
          bucketPhotos.unshift(primaryUrl)
        }
      } else {
        bucketPhotos = batchUrls
      }
    }
  }

  // Relasi tabel (prioritas #2) - jika ada data relasi
  if (baris.kegiatan_internal_photos && baris.kegiatan_internal_photos.length > 0) {
    for (const foto of baris.kegiatan_internal_photos as any) {
      if (foto.storage_url || foto.storage_path) {
        bucketPhotos.push(foto.storage_url ?? (urlPublik(foto.storage_path) as string))
      }
    }
  }

  // Foto utama dari baris kegiatan (fallback #3, tapi hanya jika bucket tidak ada)
  if (bucketPhotos.length === 0) {
    const primaryUrl = (baris.image_url || urlPublik(baris.image_path || "")) as string | null
    if (primaryUrl) {
      bucketPhotos.unshift(primaryUrl)
    }
  }

  // Fallback pattern matching filename (jika semua gagal)
  if (bucketPhotos.length === 0 && baris.tanggal_kegiatan && baris.judul) {
    const dateStr = baris.tanggal_kegiatan.replace(/-/g, "-")
    const keyword = baris.judul.toLowerCase().split(" ").slice(0, 3).join(" ")

    for (const f of storageFiles) {
      const filename = f.name.toLowerCase()
      if (/^kegiatan[-_]?\d{4}-\d{2}-\d{2}[-_]?\d*photo?\d*\.(webp|png|jpg)$/.test(filename)) {
        bucketPhotos.push(urlPublik(f.name) as string)
      } else if (filename.includes(`-${dateStr}-`) && /\.(webp|png|jpg)/.test(filename)) {
        bucketPhotos.push(urlPublik(f.name) as string)
      }
    }
  }

  const fotoUrl = bucketPhotos[0] || null
  const tanggal = baris.tanggal_kegiatan?.split?.("T")?.[0] ?? baris.created_at?.split?.("T")?.[0] ?? null

  return {
    id: String(baris.id),
    judul: (baris.judul || "").trim() || "Kegiatan Tanpa Judul",
    subJudul: baris.sub_judul?.trim() || null,
    keterangan: baris.cerita_kegiatan?.trim() ? baris.cerita_kegiatan.trim() : baris.sub_judul?.trim() || null,
    tanggal,
    unitKerja: unit.nama,
    unitKerjaSlug: unit.slug,
    fotoUrl,
    fotoUrls: bucketPhotos as string[],
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
 * Kedua bucket akan disinkronisasi agar **semua foto dari 94 foto terunggah** bisa tampil.
 */
async function ambilBerkasStorage(): Promise<StorageFileItem[]> {
  if (!supabase) return []

  const allFiles: StorageFileItem[] = []
  const bucketsToRead = [DOKUMENTASI_BUCKET, INTERNAL_PHOTOS_BUCKET] // Kedua bucket!
  let offset = 0
  const pageSize = 1000

  for (const bucketName of bucketsToRead) {
    try {
      while (true) {
        const storageRes = await supabase.storage.from(bucketName).list("", { limit: pageSize, offset })
        if (storageRes.error || !storageRes.data || storageRes.data.length === 0) break

        for (const f of storageRes.data) {
          allFiles.push({ name: f.name, created_at: f.created_at ?? "" })
        }

        if (storageRes.data.length < pageSize) break
        offset += pageSize
        if (offset > 5000) break // safety cap per bucket
      }

      // Log setiap bucket yang dibaca untuk debug
      console.debug(`[kegiatan] bucket ${bucketName} berhasil diambil, total foto: ${allFiles.length}`)
    } catch (err) {
      console.warn(`[kegiatan] membaca bucket ${bucketName} gagal (${bucketName}):`, err instanceof Error ? err.message : String(err))
    }
  }

  if (allFiles.length === 0 && supabase) {
    // Fallback ke kedua bucket jika error
    const bucketsToTry = [DOKUMENTASI_BUCKET, INTERNAL_PHOTOS_BUCKET]
    for (const bucketName of bucketsToTry) {
      try {
        while (true) {
          const storageRes = await supabase.storage.from(bucketName).list("", { limit: pageSize, offset })
          if (!storageRes.data || storageRes.data.length === 0) break

          for (const f of storageRes.data) {
            allFiles.push({ name: f.name, created_at: f.created_at ?? "" })
          }

          if (storageRes.data.length < pageSize) break
          offset += pageSize
          if (offset > 5000) break
        }
      } catch (err) {
        // skip jika bucket tidak bisa diakses
      }
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

  const kegiatan = barisData
    .map((b) => keKegiatan(b, storageFiles, barisData))
    // TIDAK HANYA YANG PUNYA FOTO URL SAJA - SEMUA KEGIATAN DI-TAMPILKAN (biar foto bisa di-load dari bucket)
    // Hanya filter yang tidak punya foto, biar kita tampilkan semua kegiatan yang minimal punya 1 foto

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
