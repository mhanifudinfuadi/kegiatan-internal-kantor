'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { uploadDokumentasi } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useTransition } from "react"
import { Plus, Upload, ArrowLeft, Image as ImageIcon } from "lucide-react"

const schema = z.object({
  judul: z.string().min(1, "Judul wajib diisi"),
  keterangan: z.string().optional(),
  tanggal: z.string().optional(),
  unitKerja: z.string().optional(),
})

export default function DashboardPage() {
  const [pending, startTransition] = useTransition()
  const [lastUpload, setLastUpload] = useState<{ path: string | null; url: string | null } | null>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { judul: "", keterangan: "", tanggal: "", unitKerja: "" },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    const formData = new FormData()
    const fileInput = document.getElementById("dokumentasi-file") as HTMLInputElement | null
    const file = fileInput?.files?.[0] ?? null

    if (!file) {
      toast({ title: "File belum dipilih", description: "Pilih foto kegiatan sebelum mengunggah." })
      return
    }

    formData.append("file", file)
    formData.append("judul", values.judul)
    formData.append("keterangan", values.keterangan ?? "")
    formData.append("tanggal", values.tanggal ?? "")
    formData.append("unitKerja", values.unitKerja ?? "")

    startTransition(async () => {
      const result = await uploadDokumentasi(formData)
      if (result.ok) {
        setLastUpload({ path: result.path ?? null, url: result.url ?? null })
        form.reset()
        toast({ title: "Berhasil diunggah", description: result.message })
      } else {
        toast({ title: "Gagal mengunggah", description: result.message })
      }
    })
  }

  return (
    <main className="min-h-screen bg-[#f6e9ef] text-[#3a2631] font-body">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/dokumentasi"
            className="inline-flex items-center gap-2 rounded-full bg-white/60 border border-white px-3 py-1.5 text-sm font-semibold text-[#3a2631] hover:bg-white transition"
          >
            <ArrowLeft size={16} />
            Kembali ke Dokumentasi
          </Link>
        </div>

        <div className="border border-white/70 rounded-3xl bg-white/80 backdrop-blur-md p-8 md:p-12 shadow-xl">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-[#3a2631] tracking-tight">
              Unggah Dokumentasi Kegiatan
            </h2>
            <p className="mt-2 text-sm text-[#785f6b]">
              Foto akan masuk ke arsip dokumentasi dan tampil di halaman dokumentasi
              serta showcase. Unggah lewad menu dashboard ini.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="judul">Judul kegiatan</Label>
                <Input
                  id="judul"
                  placeholder="Contoh: Rapat Koordinasi Triwulan"
                  {...form.register("judul")}
                  className={form.formState.errors.judul ? "border-destructive" : ""}
                />
                {form.formState.errors.judul && (
                  <p className="text-xs text-destructive">{form.formState.errors.judul.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal kegiatan</Label>
                <Input id="tanggal" type="date" {...form.register("tanggal")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitKerja">Unit kerja</Label>
              <Input
                id="unitKerja"
                placeholder="Contoh: Tim IT, Seksi Keuangan, Cabang Pusat"
                {...form.register("unitKerja")}
              />
              <p className="text-xs text-[#785f6b]">
                Diisi bebas; digunakan untuk mengelompokkan dokumentasi per unit.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea id="keterangan" rows={3} {...form.register("keterangan")} />
            </div>

            <div className="space-y-2 border rounded-2xl border-dashed border-[#c2587f]/40 bg-[#c2587f]/10 p-4">
              <div className="flex items-center gap-3">
                <Upload size={20} strokeWidth={2} className="text-[#c2587f]" />
                <span className="font-medium text-[#3a2631]">Pilih foto dokumentasi</span>
              </div>
              <Input
                id="dokumentasi-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full text-sm text-[#785f6b] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#c2587f]/20 file:text-[#7a3b52] hover:file:bg-[#c2587f]/40 border-none bg-transparent p-0"
              />
              <p className="text-xs text-[#785f6b]">
                Format JPG, PNG atau WebP. Maksimal 8 MB.
              </p>
            </div>

            <Button
              type="submit"
              disabled={pending}
              className="w-full py-3 bg-[#102b46] text-white font-semibold rounded-xl hover:bg-[#1b3d5b] transition disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {pending ? (
                <>
                  <ImageIcon size={18} strokeWidth={2} className="animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Plus size={18} strokeWidth={2} />
                  Simpan Dokumentasi
                </>
              )}
            </Button>
          </form>

          {lastUpload && (
            <div className="mt-8 border border-[#c2587f]/30 rounded-2xl bg-[#c2587f]/10 p-4">
              <div className="flex items-start gap-3">
                <ImageIcon size={18} className="text-[#c2587f]" />
                <div>
                  <p className="font-semibold text-[#3a2631]">Terakhir diunggah</p>
                  <p className="text-sm text-[#785f6b]">{lastUpload.path}</p>
                </div>
              </div>
              {lastUpload.url && (
                <div className="mt-3 flex items-center gap-3 text-xs text-[#785f6b]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#c2587f]/40 bg-[#c2587f]/20">
                    <span className="text-[10px] font-bold">✓</span>
                  </span>
                  Foto tersimpan di bucket dokumentasi dan siap tampil di web.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
