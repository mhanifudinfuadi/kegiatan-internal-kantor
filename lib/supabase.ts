import { createClient } from "@supabase/supabase-js"
import { normalisasiUnitKerja } from "@/lib/unit-kerja"
import type { Kegiatan, KegiatanPayload } from "@/lib/types"

/**
 * Sumber data tunggal website publik "Kegiatan Internal Kantor".
 *
 * Data dibaca dari tabel publik `dokumentasi` di Supabase yang sama dengan
 * portal admin utama (madujakbarsport-UPDATE). Admin mengunggah foto lewat
 * portal tersebut; website ini hanya membaca.
 *
 * Env yang dipakai:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Catatan hak akses: tabel `dokumentasi` harus diberi GRANT SELECT untuk role
 * anon. Jalankan docs/supabase-kegiatan-internal.sql di Supabase SQL Editor.
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

type BarisDokumentasi = {
  id: number | string
  judul: string | null
  keterangan: string | null
  tanggal: string | null
  storage_path: string | null
  storage_url: string | null
  urutan: number | null
  created_at: string | null
  unit_kerja?: string | null
  cabang?: string | null
}

const kolomLengkap =
  "id, judul, keterangan, tanggal, storage_path, storage_url, urutan, created_at, unit_kerja, cabang"
const kolomTanpaUnitKerja =
  "id, judul, keterangan, tanggal, storage_path, storage_url, urutan, created_at, cabang"

function keKegiatan(baris: BarisDokumentasi): Kegiatan {
  const unit = normalisasiUnitKerja(baris.unit_kerja ?? baris.cabang)

  return {
    id: String(baris.id),
    judul: (baris.judul ?? "").trim() || "Kegiatan Tanpa Judul",
    keterangan: baris.keterangan?.trim() ? baris.keterangan.trim() : null,
    tanggal: baris.tanggal ?? null,
    unitKerja: unit.nama,
    unitKerjaSlug: unit.slug,
    fotoUrl:
      baris.storage_url?.trim()
        ? baris.storage_url.trim()
        : baris.storage_path?.trim()
          ? supabase!.storage.from(DOKUMENTASI_BUCKET).getPublicUrl(baris.storage_path.trim()).data.publicUrl
          : null,
    createdAt: baris.created_at ?? "",
  }
}

/**
 * Ambil daftar kegiatan terbaru. Mengembalikan `sumber: "contoh"` beserta
 * catatan bila Supabase belum dikonfigurasi atau belum bisa dibaca, supaya
 * halaman tetap informatif.
 */
export async function fetchKegiatan(limit = 200): Promise<KegiatanPayload> {
  if (!supabase) {
    return {
      kegiatan: kegiatanContoh(),
      sumber: "contoh",
      catatan:
        "Supabase belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY kosong). Menampilkan data contoh.",
    }
  }

  const jalankan = async (kolom: string) => {
    return supabase
      .from("dokumentasi")
      .select(kolom)
      .order("tanggal", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit)
  }

  let hasil: any
  try {
    hasil = await jalankan(kolomLengkap)
  } catch (e: any) {
    console.error("[kegiatan] gagal memuat:", e?.message ?? e)
    return {
      kegiatan: kegiatanContoh(),
      sumber: "contoh",
      catatan: `Data kegiatan belum dapat dibaca dari Supabase (${e?.message ?? e}). Menampilkan data contoh.`,
    }
  }

  // Kolom `unit_kerja` ditambahkan lewat migrasi. Bila migrasi belum dijalankan
  // atau tabel belum punya kolom itu, ulangi запрос tanpa kolom tersebut.
  const kode = hasil.error?.code
  if (hasil.error && (kode === "42703" || kode === "PGRST204" || kode === "PGRST200")) {
    try {
      hasil = await jalankan(kolomTanpaUnitKerja)
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

  const kegiatan = (hasil.data as unknown as BarisDokumentasi[]).map(keKegiatan)
  return { kegiatan, sumber: "supabase", catatan: null }
}

/**
 * Data contoh supaya halaman tetap punya isi ketika Supabase belum siap.
 * Foto diarahkan ke route placeholder lokal.
 */
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
    {
      judul: "Kampanye Publikasi Program Kantor Semester III",
      keterangan:
        "Persiapan materi promosi dan cetak untuk kegiatan eksternal kantor.",
      tanggal: "2026-06-21",
      unit: "Pemasaran & Komunikasi",
      foto: 6,
    },
    {
      judul: "Penandatanganan Kerja Sama Mitra",
      keterangan:
        "Serah terima dokumen kerja sama dan Arsip bukti dukung.",
      tanggal: "2026-06-04",
      unit: "Legal",
      foto: 7,
    },
    {
      judul: "Pelatihan Internal Pengadaan Barang dan Jasa",
      keterangan:
        "Penyelarasan prosedur pengadaan barang dan jasa di lingkup kantor pusat.",
      tanggal: "2026-05-19",
      unit: "Sumber Daya Manusia",
      foto: 8,
    },
    {
      judul: "Apraisal Aset dan Asuransi Kantor",
      keterangan:
        "Pendataan nilai aset dan penyesuaian polis asuransi aset kantor.",
      tanggal: "2026-05-02",
      unit: "Keuangan",
      foto: 9,
    },
    {
      judul: "Audit Sistem dan Pembaruan Akses Pengguna",
      keterangan:
        "Evaluasi hak akses aplikasi internal dan penonaktifan akun yang tidak dipakai.",
      tanggal: "2026-04-15",
      unit: "Teknologi Informasi",
      foto: 10,
    },
    {
      judul: "Rapat Kerja Bersama Seluruh Cabang",
      keterangan:
        "Sinkronisasi standar layanan dan pelaporan antar cabang.",
      tanggal: "2026-03-25",
      unit: "Umum",
      foto: 11,
    },
    {
      judul: "Penataan Gudang dan Distribusi Perlengkapan",
      keterangan:
        "Penataan ulang gudang kantor dan penomoran ulang rak penyimpanan.",
      tanggal: "2026-03-08",
      unit: "Operasional",
      foto: 12,
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
