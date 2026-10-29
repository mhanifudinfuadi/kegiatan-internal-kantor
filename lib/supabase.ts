import { createClient } from "@supabase/supabase-js"
import { normalisasiUnitKerja } from "@/lib/unit-kerja"
import type { Kegiatan, KegiatanPayload } from "@/lib/types"

/**
 * Sumber data tunggal website publik "Kegiatan Internal Kantor".
 *
 * Data dibaca dari tabel publik `kegiatan_internal_kantor` di Supabase yang sama
 * dengan portal admin utama (madusportupdate). Admin mengunggah foto lewat
 * portal tersebut; website ini hanya membaca.
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

const kolomLengkap =
  "id, judul, sub_judul, jenis_kegiatan, cerita_kegiatan, image_path, image_url, published, created_at, tanggal_kegiatan, kegiatan_internal_photos(id, storage_path, storage_url)"
const kolomTanpaRelasi =
  "id, judul, sub_judul, jenis_kegiatan, cerita_kegiatan, image_path, image_url, published, created_at, tanggal_kegiatan"

function keKegiatan(baris: any): Kegiatan {
  const unit = normalisasiUnitKerja(baris.jenis_kegiatan ?? baris.sub_judul ?? baris.judul)

  let fotoUrl: string | null = null
  if (Array.isArray(baris.kegiatan_internal_photos) && baris.kegiatan_internal_photos.length > 0) {
    const foto = baris.kegiatan_internal_photos.find((f: any) => f?.storage_url) || baris.kegiatan_internal_photos[0]
    if (foto?.storage_url?.trim()) fotoUrl = foto.storage_url.trim()
    else if (foto?.storage_path?.trim() && supabase) {
      fotoUrl = supabase.storage.from(INTERNAL_PHOTOS_BUCKET).getPublicUrl(foto.storage_path.trim()).data.publicUrl
    }
  }
  if (!fotoUrl && baris.image_url?.trim()) {
    fotoUrl = baris.image_url.trim()
  }
  if (!fotoUrl && baris.image_path?.trim() && supabase) {
    // Try both buckets
    fotoUrl = supabase.storage.from(DOKUMENTASI_BUCKET).getPublicUrl(baris.image_path.trim()).data.publicUrl
  }

  const tanggal = baris.tanggal_kegiatan?.split?.("T")?.[0] ?? baris.created_at?.split?.("T")?.[0] ?? null

  return {
    id: String(baris.id),
    judul: (baris.judul ?? "").trim() || "Kegiatan Tanpa Judul",
    keterangan: baris.cerita_kegiatan?.trim() ? baris.cerita_kegiatan.trim() : baris.sub_judul?.trim() || null,
    tanggal,
    unitKerja: unit.nama,
    unitKerjaSlug: unit.slug,
    fotoUrl,
    createdAt: baris.created_at ?? "",
  }
}

export async function fetchKegiatan(limit = 200): Promise<KegiatanPayload> {
  if (!supabase) {
    return {
      kegiatan: kegiatanContoh(),
      sumber: "contoh",
      catatan:
        "Supabase belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY kosong). Menampilkan data contoh.",
    }
  }

  let hasil: any
  try {
    hasil = await supabase
      .from("kegiatan_internal_kantor")
      .select(kolomLengkap)
      .eq("published", true)
      .order("tanggal_kegiatan", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit)
  } catch (e: any) {
    console.error("[kegiatan] gagal memuat:", e?.message ?? e)
    return {
      kegiatan: kegiatanContoh(),
      sumber: "contoh",
      catatan: `Data kegiatan belum dapat dibaca dari Supabase (${e?.message ?? e}). Menampilkan data contoh.`,
    }
  }

  const kode = hasil.error?.code
  if (hasil.error && (kode === "42703" || kode === "PGRST200" || kode === "PGRST204")) {
    try {
      hasil = await supabase
        .from("kegiatan_internal_kantor")
        .select(kolomTanpaRelasi)
        .eq("published", true)
        .order("tanggal_kegiatan", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit)
    } catch (e: any) {
      console.error("[kegiatan] gagal memuat:", e?.message ?? e)
      return {
        kegiatan: kegiatanContoh(),
        sumber: "contoh",
        catatan: `Data kegiatan belum dapat dibaca dari Supabase (${e?.message ?? e}). Menampilkan data contoh.`,
      }
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

  const kegiatan = ((hasil.data as unknown[]) || []).map(keKegiatan).filter((k) => k.fotoUrl)
  if (kegiatan.length === 0) {
    return { kegiatan: [], sumber: "supabase", catatan: null }
  }
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
      unit: "Umum",
      foto: 1,
    },
    {
      judul: "Pemeliharaan Server dan Arsip Digital Kantor",
      keterangan:
        "Pemindahan data arsip kegiatan ke penyimpanan terpusat dan pencadangan perangkat ruang rapat.",
      tanggal: "2026-08-27",
      unit: "Teknologi Informasi",
      foto: 2,
    },
    {
      judul: "Pelatihan Standar Keselamatan Kerja dan K3",
      keterangan:
        "Sosialisasi standar keselamatan kerja dan pemeriksaan perangkat proteksi diri.",
      tanggal: "2026-08-12",
      unit: "Sumber Daya Manusia",
      foto: 3,
    },
    {
      judul: "Rekonsiliasi Anggaran Tahunan Unit Kerja",
      keterangan:
        "Penyesuaian pagu anggaran operasional dengan rencana kegiatan bulan berikutnya.",
      tanggal: "2026-07-30",
      unit: "Keuangan",
      foto: 4,
    },
    {
      judul: "Penataan Ulang Ruang Kerja dan Aset Kantor",
      keterangan:
        "Pelabelan aset, penataan arsip, dan penataan ulang ruang rapat utama.",
      tanggal: "2026-07-09",
      unit: "Operasional",
      foto: 5,
    },
  ]

  return contoh.map((item, index) => {
    const unit = normalisasiUnitKerja(item.unit)
    return {
      id: `contoh-${index + 1}`,
      judul: item.judul,
      keterangan: item.keterangan,
      tanggal: item.tanggal,
      unitKerja: unit.nama,
      unitKerjaSlug: unit.slug,
      fotoUrl: `/api/contoh-foto/${item.foto}?label=${encodeURIComponent(unit.nama)}`,
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
