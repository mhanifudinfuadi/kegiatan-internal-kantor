"use client"

import { useEffect } from "react"
import { ArrowLeft, ArrowRight, CalendarDays, X } from "lucide-react"
import type { Kegiatan } from "@/lib/types"

type Props = {
  kegiatan: Kegiatan[]
  index: number | null
  onTutup: () => void
  onPilih: (index: number) => void
}

function formatTanggal(value: string | null) {
  if (!value) return null
  const tanggal = new Date(value)
  if (Number.isNaN(tanggal.getTime())) return null
  return tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function Lightbox({ kegiatan, index, onTutup, onPilih }: Props) {
  const aktif = index === null ? null : (kegiatan[index] ?? null)

  useEffect(() => {
    if (!aktif) return

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onTutup()
      if (event.key === "ArrowRight" && index !== null) {
        onPilih((index + 1) % kegiatan.length)
      }
      if (event.key === "ArrowLeft" && index !== null) {
        onPilih((index - 1 + kegiatan.length) % kegiatan.length)
      }
    }

    document.addEventListener("keydown", onKey)
    const overflowAwal = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflowAwal
    }
  }, [aktif, index, kegiatan.length, onPilih, onTutup])

  if (!aktif || index === null) return null

  const tanggal = formatTanggal(aktif.tanggal)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={aktif.judul}
      className="fixed inset-0 z-50 flex flex-col bg-[#080f18]/96 backdrop-blur-sm"
    >
      <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <p className="truncate text-sm text-white/60">
          <span className="font-semibold text-white">{aktif.unitKerja}</span>
          <span className="mx-2 text-white/30">/</span>
          {String(index + 1).padStart(2, "0")} · {String(kegiatan.length).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={onTutup}
          aria-label="Tutup galeri"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/40 hover:text-white"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-3 px-3 sm:gap-6 sm:px-8">
        <button
          type="button"
          onClick={() => onPilih((index - 1 + kegiatan.length) % kegiatan.length)}
          aria-label="Foto sebelumnya"
          className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/40 hover:text-white sm:flex"
        >
          <ArrowLeft size={19} />
        </button>

        <figure className="flex min-h-0 w-full max-w-5xl flex-col items-center">
          {aktif.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={aktif.fotoUrl}
              alt={aktif.judul}
              className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain shadow-[0_40px_90px_-30px_rgba(0,0,0,.9)]"
            />
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-white/5 text-xs uppercase tracking-[.2em] text-white/40">
              Tanpa foto
            </div>
          )}

          <figcaption className="mt-5 max-w-3xl text-center">
            <h3 className="font-display text-xl leading-snug text-white sm:text-2xl">
              {aktif.judul}
            </h3>
            {aktif.keterangan ? (
              <p className="mt-2 text-sm leading-6 text-white/60">{aktif.keterangan}</p>
            ) : null}
            {tanggal ? (
              <p className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[.2em] text-white/45">
                <CalendarDays size={13} /> {tanggal}
              </p>
            ) : null}
          </figcaption>
        </figure>

        <button
          type="button"
          onClick={() => onPilih((index + 1) % kegiatan.length)}
          aria-label="Foto berikutnya"
          className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/40 hover:text-white sm:flex"
        >
          <ArrowRight size={19} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 py-5 sm:hidden">
        <button
          type="button"
          onClick={() => onPilih((index - 1 + kegiatan.length) % kegiatan.length)}
          aria-label="Foto sebelumnya"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => onPilih((index + 1) % kegiatan.length)}
          aria-label="Foto berikutnya"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
