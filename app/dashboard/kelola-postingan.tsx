'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  ambilPostingan,
  updatePostingan,
  tambahFotoPostingan,
  hapusFotoPostingan,
  hapusPostingan,
  type PostinganAdmin,
} from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { DAFTAR_UNIT_KERJA } from '@/lib/unit-kerja'
import { Pencil, Trash2, X, Plus, ImageOff, Loader2, Eye, EyeOff } from 'lucide-react'

function formatTanggal(value: string | null) {
  if (!value) return 'Tanggal belum dicatat'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Tanggal belum dicatat'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export default function KelolaPostingan({ refreshKey }: { refreshKey: number }) {
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<PostinganAdmin[]>([])
  const [editing, setEditing] = useState<PostinganAdmin | null>(null)
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<PostinganAdmin | null>(null)

  const muat = useCallback(async () => {
    setLoading(true)
    const hasil = await ambilPostingan()
    setItems(hasil.data)
    setError(hasil.ok ? null : hasil.message ?? 'Gagal memuat postingan.')
    setLoading(false)
  }, [])

  useEffect(() => {
    muat()
  }, [muat, refreshKey])

  function jalankan(aksi: () => Promise<{ ok: boolean; message: string }>, sukses: string) {
    startTransition(async () => {
      const hasil = await aksi()
      if (hasil.ok) {
        toast({ title: sukses, description: hasil.message })
        await muat()
      } else {
        toast({ title: 'Gagal', description: hasil.message })
      }
    })
  }

  return (
    <section className="mt-10 border border-white/70 rounded-3xl bg-white/80 backdrop-blur-md p-6 md:p-8 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-[#3a2631]">Kelola Postingan</h2>
          <p className="mt-1 text-sm text-[#785f6b]">
            Edit data, tambah atau hapus sebagian foto, atau hapus seluruh postingan.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => muat()}
          disabled={loading || pending}
          className="rounded-full border-[#c2587f]/40 text-[#7a3b52]"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Muat ulang'}
        </Button>
      </div>

      {error && (
        <p role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-[#785f6b]">
          <Loader2 size={16} className="animate-spin" /> Memuat postingan…
        </p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-[#785f6b]">Belum ada postingan dokumentasi.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-[#c2587f]/20 bg-white/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#7a3b52]">
                    <span className="rounded-full bg-[#c2587f]/15 px-2 py-0.5 font-semibold uppercase tracking-wide">
                      {item.unitKerja}
                    </span>
                    <span>{formatTanggal(item.tanggal)}</span>
                    <span className="inline-flex items-center gap-1">
                      {item.published ? <Eye size={12} /> : <EyeOff size={12} />}
                      {item.published ? 'Tampil' : 'Disembunyikan'}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-lg text-[#3a2631]">{item.judul}</h3>
                  {item.subJudul && <p className="text-sm text-[#785f6b]">{item.subJudul}</p>}
                  {item.keterangan && (
                    <p className="mt-1 line-clamp-2 text-sm text-[#785f6b]">{item.keterangan}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(item)}
                    className="rounded-full border-[#c2587f]/40 text-[#7a3b52]"
                  >
                    <Pencil size={14} className="mr-1" /> Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setKonfirmasiHapus(item)}
                    className="rounded-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} className="mr-1" /> Hapus
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {item.foto.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#785f6b]">
                    <ImageOff size={14} /> Tidak ada foto
                  </span>
                ) : (
                  item.foto.map((foto, idx) => (
                    <div
                      key={`${foto.path}-${idx}`}
                      className="group relative h-20 w-24 overflow-hidden rounded-lg border border-[#c2587f]/20 bg-[#f6e9ef]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={foto.url} alt={`Foto ${idx + 1} dari ${item.judul}`} className="h-full w-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-[#102b46]/80 px-1 text-[9px] font-semibold uppercase text-white">
                          Utama
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={pending || item.foto.length <= 1}
                        title={item.foto.length <= 1 ? 'Foto terakhir tidak bisa dihapus' : 'Hapus foto ini'}
                        onClick={() =>
                          jalankan(() => hapusFotoPostingan(item.id, foto.path), 'Foto dihapus')
                        }
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-red-600/90 text-white opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Hapus foto ${idx + 1}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EditDialog
          item={editing}
          pending={pending}
          onClose={() => setEditing(null)}
          onSave={(formData) =>
            jalankan(async () => {
              const hasil = await updatePostingan(formData)
              if (hasil.ok) setEditing(null)
              return hasil
            }, 'Perubahan tersimpan')
          }
          onTambahFoto={(formData) => jalankan(() => tambahFotoPostingan(formData), 'Foto ditambahkan')}
        />
      )}

      {konfirmasiHapus && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-[#3a2631]">Hapus postingan?</h3>
            <p className="mt-2 text-sm text-[#785f6b]">
              “{konfirmasiHapus.judul}” beserta {konfirmasiHapus.foto.length} fotonya akan dihapus permanen.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setKonfirmasiHapus(null)} disabled={pending}>
                Batal
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  jalankan(async () => {
                    const hasil = await hapusPostingan(konfirmasiHapus.id)
                    if (hasil.ok) setKonfirmasiHapus(null)
                    return hasil
                  }, 'Postingan dihapus')
                }
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {pending ? <Loader2 size={16} className="animate-spin" /> : 'Hapus permanen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function EditDialog({
  item,
  pending,
  onClose,
  onSave,
  onTambahFoto,
}: {
  item: PostinganAdmin
  pending: boolean
  onClose: () => void
  onSave: (formData: FormData) => void
  onTambahFoto: (formData: FormData) => void
}) {
  const [judul, setJudul] = useState(item.judul)
  const [subJudul, setSubJudul] = useState(item.subJudul ?? '')
  const [unitKerja, setUnitKerja] = useState(item.unitKerja)
  const [tanggal, setTanggal] = useState(item.tanggal ?? '')
  const [keterangan, setKeterangan] = useState(item.keterangan ?? '')
  const [published, setPublished] = useState(item.published)

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.append('id', item.id)
    formData.append('judul', judul)
    formData.append('subJudul', subJudul)
    formData.append('unitKerja', unitKerja)
    formData.append('tanggal', tanggal)
    formData.append('keterangan', keterangan)
    formData.append('published', String(published))
    onSave(formData)
  }

  function tambah(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const input = e.currentTarget.elements.namedItem('file') as HTMLInputElement | null
    const files = Array.from(input?.files ?? [])
    if (files.length === 0) return
    const formData = new FormData()
    formData.append('id', item.id)
    for (const file of files) formData.append('file', file)
    onTambahFoto(formData)
    if (input) input.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="mx-auto my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-[#3a2631]">Edit postingan</h3>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-full p-1 hover:bg-[#f6e9ef]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-judul">Judul kegiatan</Label>
              <Input id="edit-judul" value={judul} onChange={(e) => setJudul(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tanggal">Tanggal kegiatan</Label>
              <Input id="edit-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-subjudul">Sub judul</Label>
            <Input id="edit-subjudul" value={subJudul} onChange={(e) => setSubJudul(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-unit">Unit kerja / jenis kegiatan</Label>
            <Input
              id="edit-unit"
              list="daftar-unit-kerja-edit"
              value={unitKerja}
              onChange={(e) => setUnitKerja(e.target.value)}
            />
            <datalist id="daftar-unit-kerja-edit">
              {DAFTAR_UNIT_KERJA.map((unit) => (
                <option key={unit.slug} value={unit.nama} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-keterangan">Keterangan</Label>
            <Textarea id="edit-keterangan" rows={3} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#3a2631]">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Tampilkan di website
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Batal
            </Button>
            <Button type="submit" disabled={pending} className="bg-[#102b46] text-white hover:bg-[#1b3d5b]">
              {pending ? <Loader2 size={16} className="animate-spin" /> : 'Simpan perubahan'}
            </Button>
          </div>
        </form>

        <form onSubmit={tambah} className="mt-6 space-y-2 border-t border-[#c2587f]/20 pt-4">
          <Label htmlFor="edit-tambah-foto">Tambah foto ke postingan ini</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="edit-tambah-foto"
              name="file"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="max-w-sm text-sm"
            />
            <Button type="submit" disabled={pending} variant="outline" className="rounded-full border-[#c2587f]/40 text-[#7a3b52]">
              <Plus size={14} className="mr-1" /> Tambah foto
            </Button>
          </div>
          <p className="text-xs text-[#785f6b]">JPG, PNG, atau WebP, maksimal 8 MB per foto.</p>
        </form>
      </div>
    </div>
  )
}
