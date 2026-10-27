'use server'

import { revalidatePath } from "next/cache"
import { supabaseAdmin, isSupabaseAdminConfigured, DOKUMENTASI_BUCKET } from "@/lib/supabase"

export type UploadResult = {
  ok: boolean
  message: string
  path?: string | null
  url?: string | null
}

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/, "") || "file"
}

export async function uploadDokumentasi(formData: FormData): Promise<UploadResult> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return { ok: false, message: "Supabase admin belum dikonfigurasi (SUPABASE_SERVICE_ROLE_KEY kosong)." }
  }

  const file = formData.get("file") as File | null
  const judul = String(formData.get("judul") ?? "").trim()
  const keterangan = String(formData.get("keterangan") ?? "").trim() || null
  const tanggal = String(formData.get("tanggal") ?? "").trim() || null
  const unitKerja = String(formData.get("unitKerja") ?? "").trim() || null

  if (!file) {
    return { ok: false, message: "Pilih file foto terlebih dahulu." }
  }
  if (!judul) {
    return { ok: false, message: "Judul kegiatan wajib diisi." }
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "File yang diunggah harus berupa gambar." }
  }

  const fileName = `dokumentasi/${Date.now()}-${sanitizeFileName(file.name)}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabaseAdmin.storage
    .from(DOKUMENTASI_BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    return { ok: false, message: `Gagal unggah foto: ${uploadError.message}` }
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(DOKUMENTASI_BUCKET)
    .getPublicUrl(fileName)

  const { error: insertError } = await supabaseAdmin.from("dokumentasi").insert({
    judul,
    keterangan,
    tanggal: tanggal ?? null,
    storage_path: fileName,
    storage_url: urlData.publicUrl,
    urutan: 0,
    unit_kerja: unitKerja ?? null,
  })

  if (insertError) {
    await supabaseAdmin.storage.from(DOKUMENTASI_BUCKET).remove([fileName])
    return { ok: false, message: `Gagal simpan data dokumentasi: ${insertError.message}` }
  }

  revalidatePath("/dokumentasi")
  revalidatePath("/dokumentasi-showcase")
  revalidatePath("/galeri")
  revalidatePath("/api/preview-photos")

  return {
    ok: true,
    message: "Dokumentasi kegiatan berhasil diunggah.",
    path: fileName,
    url: urlData.publicUrl,
  }
}
