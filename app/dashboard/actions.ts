'use server'

import { revalidatePath } from "next/cache"
import { supabaseAdmin, isSupabaseAdminConfigured, DOKUMENTASI_BUCKET, TABEL_KEGIATAN } from "@/lib/supabase"
import { normalisasiUnitKerja } from "@/lib/unit-kerja"

export type UploadResult = {
  ok: boolean
  message: string
  path?: string | null
  url?: string | null
  paths?: string[]
}

export type FotoItem = { path: string; url: string }

export type PostinganAdmin = {
  id: string
  judul: string
  subJudul: string | null
  keterangan: string | null
  tanggal: string | null
  unitKerja: string
  foto: FotoItem[]
  published: boolean
  createdAt: string
}

export type AksiResult = { ok: boolean; message: string }

const MAKS_UKURAN = 8 * 1024 * 1024
const TIPE_DIIZINKAN = ["image/jpeg", "image/png", "image/webp"]

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "file"
}

function revalidateSemua() {
  revalidatePath("/dokumentasi")
  revalidatePath("/dokumentasi-showcase")
  revalidatePath("/galeri")
  revalidatePath("/talks-showcase")
  revalidatePath("/dashboard")
  revalidatePath("/api/kegiatan")
  revalidatePath("/api/preview-photos")
}

function urlPublik(path: string) {
  if (!supabaseAdmin) return ""
  return supabaseAdmin.storage.from(DOKUMENTASI_BUCKET).getPublicUrl(path).data.publicUrl
}

function validasiFile(files: File[]): string | null {
  for (const file of files) {
    if (!TIPE_DIIZINKAN.includes(file.type)) {
      return `File "${file.name}" harus berupa JPG, PNG, atau WebP.`
    }
    if (file.size > MAKS_UKURAN) {
      return `File "${file.name}" melebihi batas 8 MB.`
    }
  }
  return null
}

async function unggahFiles(files: File[], prefix: string): Promise<{ ok: true; foto: FotoItem[] } | { ok: false; message: string }> {
  if (!supabaseAdmin) return { ok: false, message: "Supabase admin belum dikonfigurasi." }

  const stamp = Date.now()
  const diunggah: FotoItem[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileName = `${prefix}-${stamp}-${i}-${sanitizeFileName(file.name)}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabaseAdmin.storage.from(DOKUMENTASI_BUCKET).upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      if (diunggah.length > 0) {
        await supabaseAdmin.storage.from(DOKUMENTASI_BUCKET).remove(diunggah.map((f) => f.path))
      }
      return { ok: false, message: `Gagal unggah foto: ${error.message}` }
    }

    diunggah.push({ path: fileName, url: urlPublik(fileName) })
  }

  return { ok: true, foto: diunggah }
}

/** Ambil daftar foto sebuah postingan dari kolom `photos` (fallback ke image_path). */
function fotoDariBaris(baris: any): FotoItem[] {
  const list: FotoItem[] = []
  if (Array.isArray(baris.photos)) {
    for (const p of baris.photos) {
      if (typeof p === "string" && p.trim()) {
        list.push({ path: p.trim(), url: p.startsWith("http") ? p : urlPublik(p.trim()) })
      } else if (p && typeof p === "object") {
        const path = typeof p.path === "string" ? p.path.trim() : ""
        const url = typeof p.url === "string" ? p.url.trim() : path ? urlPublik(path) : ""
        if (path || url) list.push({ path: path || url, url })
      }
    }
  }
  const primaryPath = (baris.image_path ?? "").trim()
  const primaryUrl = (baris.image_url ?? "").trim() || (primaryPath ? urlPublik(primaryPath) : "")
  if (primaryUrl && !list.some((f) => f.url === primaryUrl)) {
    list.unshift({ path: primaryPath || primaryUrl, url: primaryUrl })
  }
  return list
}

function kePostingan(baris: any): PostinganAdmin {
  return {
    id: String(baris.id),
    judul: (baris.judul ?? "").trim(),
    subJudul: baris.sub_judul?.trim() || null,
    keterangan: baris.cerita_kegiatan?.trim() || null,
    tanggal: baris.tanggal_kegiatan?.split?.("T")?.[0] ?? baris.created_at?.split?.("T")?.[0] ?? null,
    unitKerja: normalisasiUnitKerja(baris.jenis_kegiatan).nama,
    foto: fotoDariBaris(baris),
    published: baris.published !== false,
    createdAt: baris.created_at ?? "",
  }
}

/** Daftar seluruh postingan dokumentasi untuk dikelola di dashboard. */
export async function ambilPostingan(): Promise<{ ok: boolean; message?: string; data: PostinganAdmin[] }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return { ok: false, message: "Supabase admin belum dikonfigurasi (SUPABASE_SERVICE_ROLE_KEY kosong).", data: [] }
  }

  // Kolom `photos` hanya ada setelah skrip SQL dijalankan; bila belum ada,
  // tetap tampilkan postingan (foto diambil dari image_path / image_url).
  const kolom = [
    "id, judul, sub_judul, jenis_kegiatan, cerita_kegiatan, tanggal_kegiatan, image_path, image_url, photos, published, created_at",
    "id, judul, sub_judul, jenis_kegiatan, cerita_kegiatan, tanggal_kegiatan, image_path, image_url, published, created_at",
  ]

  let data: any[] | null = null
  let pesanError: string | null = null

  for (const pilih of kolom) {
    const hasil = await supabaseAdmin
      .from(TABEL_KEGIATAN)
      .select(pilih)
      .order("tanggal_kegiatan", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500)

    if (!hasil.error) {
      data = hasil.data as any[]
      pesanError = null
      break
    }
    pesanError = hasil.error.message
  }

  if (pesanError) return { ok: false, message: pesanError, data: [] }
  return { ok: true, data: (data ?? []).map(kePostingan) }
}

/**
 * Unggah satu kegiatan beserta satu atau beberapa foto.
 *
 * - Foto pertama menjadi `image_path` / `image_url` (foto utama).
 * - Seluruh foto disimpan di kolom `photos` (jsonb) sebagai [{ path, url }].
 * - `jenis_kegiatan` diisi unit kerja yang sudah dinormalisasi.
 */
export async function uploadDokumentasi(formData: FormData): Promise<UploadResult> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return { ok: false, message: "Supabase admin belum dikonfigurasi (SUPABASE_SERVICE_ROLE_KEY kosong)." }
  }

  const files = formData.getAll("file").filter((f): f is File => f instanceof File && f.size > 0)
  const judul = String(formData.get("judul") ?? "").trim()
  const subJudul = String(formData.get("subJudul") ?? "").trim() || null
  const keterangan = String(formData.get("keterangan") ?? "").trim() || null
  const tanggal = String(formData.get("tanggal") ?? "").trim() || null
  const unitKerja = String(formData.get("unitKerja") ?? "").trim() || null

  if (files.length === 0) return { ok: false, message: "Pilih minimal satu foto kegiatan." }
  if (!judul) return { ok: false, message: "Judul kegiatan wajib diisi." }

  const fileError = validasiFile(files)
  if (fileError) return { ok: false, message: fileError }

  const hasil = await unggahFiles(files, "kegiatan")
  if (!hasil.ok) return { ok: false, message: hasil.message }

  const unit = normalisasiUnitKerja(unitKerja)
  const utama = hasil.foto[0]

  const { error: insertError } = await supabaseAdmin.from(TABEL_KEGIATAN).insert({
    judul,
    sub_judul: subJudul,
    jenis_kegiatan: unit.nama,
    cerita_kegiatan: keterangan,
    tanggal_kegiatan: tanggal ? new Date(`${tanggal}T00:00:00`).toISOString() : null,
    image_path: utama.path,
    image_url: utama.url,
    photos: hasil.foto,
    published: true,
  })

  if (insertError) {
    await supabaseAdmin.storage.from(DOKUMENTASI_BUCKET).remove(hasil.foto.map((f) => f.path))
    return { ok: false, message: `Gagal simpan data kegiatan: ${insertError.message}` }
  }

  revalidateSemua()

  return {
    ok: true,
    message: `${hasil.foto.length} foto berhasil diunggah.`,
    path: utama.path,
    url: utama.url,
    paths: hasil.foto.map((f) => f.path),
  }
}

/**
 * Edit data postingan (judul, sub judul, unit kerja, tanggal, keterangan,
 * status tampil) tanpa menyentuh foto.
 */
export async function updatePostingan(formData: FormData): Promise<AksiResult> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return { ok: false, message: "Supabase admin belum dikonfigurasi." }
  }

  const id = String(formData.get("id") ?? "").trim()
  const judul = String(formData.get("judul") ?? "").trim()
  const subJudul = String(formData.get("subJudul") ?? "").trim() || null
  const keterangan = String(formData.get("keterangan") ?? "").trim() || null
  const tanggal = String(formData.get("tanggal") ?? "").trim() || null
  const unitKerja = String(formData.get("unitKerja") ?? "").trim() || null
  const published = String(formData.get("published") ?? "true") === "true"

  if (!id) return { ok: false, message: "ID postingan tidak valid." }
  if (!judul) return { ok: false, message: "Judul kegiatan wajib diisi." }

  const { error } = await supabaseAdmin
    .from(TABEL_KEGIATAN)
    .update({
      judul,
      sub_judul: subJudul,
      jenis_kegiatan: normalisasiUnitKerja(unitKerja).nama,
      cerita_kegiatan: keterangan,
      tanggal_kegiatan: tanggal ? new Date(`${tanggal}T00:00:00`).toISOString() : null,
      published,
    })
    .eq("id", id)

  if (error) return { ok: false, message: `Gagal menyimpan perubahan: ${error.message}` }

  revalidateSemua()
  return { ok: true, message: "Perubahan postingan tersimpan." }
}

/**
 * Tambah foto baru ke postingan yang sudah ada.
 * Foto baru diletakkan setelah foto lama; foto utama tidak berubah.
 */
export async function tambahFotoPostingan(formData: FormData): Promise<AksiResult> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return { ok: false, message: "Supabase admin belum dikonfigurasi." }
  }

  const id = String(formData.get("id") ?? "").trim()
  const files = formData.getAll("file").filter((f): f is File => f instanceof File && f.size > 0)
  if (!id) return { ok: false, message: "ID postingan tidak valid." }
  if (files.length === 0) return { ok: false, message: "Pilih minimal satu foto." }

  const fileError = validasiFile(files)
  if (fileError) return { ok: false, message: fileError }

  const { data: baris, error: bacaError } = await supabaseAdmin
    .from(TABEL_KEGIATAN)
    .select("id, image_path, image_url, photos")
    .eq("id", id)
    .single()

  if (bacaError || !baris) return { ok: false, message: `Postingan tidak ditemukan: ${bacaError?.message ?? ""}` }

  const hasil = await unggahFiles(files, "tambah")
  if (!hasil.ok) return { ok: false, message: hasil.message }

  const fotoLama = fotoDariBaris(baris)
  const fotoBaru = [...fotoLama, ...hasil.foto]
  const utama = fotoBaru[0]

  const { error } = await supabaseAdmin
    .from(TABEL_KEGIATAN)
    .update({
      photos: fotoBaru,
      image_path: utama.path,
      image_url: utama.url,
    })
    .eq("id", id)

  if (error) {
    await supabaseAdmin.storage.from(DOKUMENTASI_BUCKET).remove(hasil.foto.map((f) => f.path))
    return { ok: false, message: `Gagal menyimpan foto baru: ${error.message}` }
  }

  revalidateSemua()
  return { ok: true, message: `${hasil.foto.length} foto ditambahkan.` }
}

/**
 * Hapus sebagian foto dari postingan (berkas di storage ikut dihapus).
 * Jika foto utama dihapus, foto berikutnya otomatis menjadi foto utama.
 */
export async function hapusFotoPostingan(id: string, path: string): Promise<AksiResult> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return { ok: false, message: "Supabase admin belum dikonfigurasi." }
  }
  if (!id || !path) return { ok: false, message: "Data foto tidak valid." }

  const { data: baris, error: bacaError } = await supabaseAdmin
    .from(TABEL_KEGIATAN)
    .select("id, image_path, image_url, photos")
    .eq("id", id)
    .single()

  if (bacaError || !baris) return { ok: false, message: `Postingan tidak ditemukan: ${bacaError?.message ?? ""}` }

  const fotoLama = fotoDariBaris(baris)
  const sisa = fotoLama.filter((f) => f.path !== path && f.url !== path)
  if (sisa.length === fotoLama.length) return { ok: false, message: "Foto tidak ditemukan pada postingan ini." }
  if (sisa.length === 0) {
    return { ok: false, message: "Foto terakhir tidak bisa dihapus. Hapus postingan jika ingin menghapus semuanya." }
  }

  const utama = sisa[0]
  const { error } = await supabaseAdmin
    .from(TABEL_KEGIATAN)
    .update({ photos: sisa, image_path: utama.path, image_url: utama.url })
    .eq("id", id)

  if (error) return { ok: false, message: `Gagal menghapus foto: ${error.message}` }

  // Hapus berkas di storage (abaikan bila path berupa URL eksternal).
  if (!path.startsWith("http")) {
    await supabaseAdmin.storage.from(DOKUMENTASI_BUCKET).remove([path])
  }

  revalidateSemua()
  return { ok: true, message: "Foto dihapus." }
}

/** Hapus seluruh postingan beserta semua fotonya di storage. */
export async function hapusPostingan(id: string): Promise<AksiResult> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return { ok: false, message: "Supabase admin belum dikonfigurasi." }
  }
  if (!id) return { ok: false, message: "ID postingan tidak valid." }

  const { data: baris, error: bacaError } = await supabaseAdmin
    .from(TABEL_KEGIATAN)
    .select("id, image_path, image_url, photos")
    .eq("id", id)
    .single()

  if (bacaError || !baris) return { ok: false, message: `Postingan tidak ditemukan: ${bacaError?.message ?? ""}` }

  const { error } = await supabaseAdmin.from(TABEL_KEGIATAN).delete().eq("id", id)
  if (error) return { ok: false, message: `Gagal menghapus postingan: ${error.message}` }

  const paths = fotoDariBaris(baris)
    .map((f) => f.path)
    .filter((p) => p && !p.startsWith("http"))
  if (paths.length > 0) {
    await supabaseAdmin.storage.from(DOKUMENTASI_BUCKET).remove(paths)
  }

  revalidateSemua()
  return { ok: true, message: "Postingan dan seluruh fotonya dihapus." }
}
