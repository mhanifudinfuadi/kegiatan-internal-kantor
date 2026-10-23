"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Maximize2 } from "lucide-react"
import type { Kegiatan } from "@/lib/types"

type Props = {
  kegiatan: Kegiatan[]
  onPilih: (index: number) => void
}

const DI_DEPAN = 7
const DI_BELAKANG = 7
const JEDA_OTOMATIS = 6500

function formatTanggal(value: string | null) {
  if (!value) return "Tanggal belum dicatat"
  const tanggal = new Date(value)
  if (Number.isNaN(tanggal.getTime())) return value
  return tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Panggung foto bertumpuk: foto aktif berada di tengah, foto lain bergerak
 * ke atas (belakang) dan ke bawah (depan) seperti tumpukan kartu.
 */
export default function HeroStack({ kegiatan, onPilih }: Props) {
  const [index, setIndex] = useState(0)
  const [jeda, setJeda] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = kegiatan.length
  const aktif = useMemo(() => kegiatan[index] ?? null, [kegiatan, index])

  const geser = useCallback(
    (arah: 1 | -1) => {
      if (total === 0) return
      setIndex((sekarang) => (sekarang + arah + total) % total)
    },
    [total],
  )

  useEffect(() => {
    if (jeda || total < 2) return
    timerRef.current = setInterval(() => geser(1), JEDA_OTOMATIS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [geser, jeda, total])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") geser(1)
      if (event.key === "ArrowLeft") geser(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [geser])

  if (!aktif) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center bg-[#0b1622] px-6 text-center">
        <p className="max-w-md text-sm leading-6 text-white/60">
          Belum ada dokumentasi kegiatan untuk ditampilkan.
        </p>
      </section>
    )
  }

  return (
    <section
      className="relative isolate overflow-hidden bg-[#0b1622]"
      onMouseEnter={() => setJeda(true)}
      onMouseLeave={() => setJeda(false)}
      aria-roledescription="karosel"
      aria-label="Galeri kegiatan"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_50%_38%,rgba(182,107,135,.22),transparent_58%),radial-gradient(circle_at_12%_88%,rgba(16,43,70,.55),transparent_52%)]" />

      <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-14 sm:px-8">
        <div className="relative mx-auto aspect-[16/9] w-full max-w-[860px]">
          {kegiatan.map((item, posisi) => {
            const jarak = posisi - index
            const diDepan = jarak > 0
            const jarakAbs = Math.abs(jarak)
            const aktifSekarang = jarak === 0

            const translateY = aktifSekarang ? 0 : diDepan ? jarak * 26 : -jarak * 30
            const scale = aktifSekarang ? 1 : diDepan ? Math.max(0.55, 1 - jarak * 0.07) : Math.max(0.5, 1 - jarak * 0.08)
            const blur = aktifSekarang ? 0 : Math.min(jarakAbs * 1.4, 6)
            const opacity = aktifSekarang ? 1 : Math.max(0, 0.72 - jarakAbs * 0.1)
            const zIndex = aktifSekarang ? 60 : diDepan ? 40 - jarak : 55 - jarakAbs

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => (aktifSekarang ? onPilih(posisi) : setIndex(posisi))}
                tabIndex={aktifSekarang ? 0 : -1}
                aria-hidden={!aktifSekarang}
                aria-label={
                  aktifSekarang
                    ? `Perbesar foto ${item.judul}`
                    : `Tampilkan ${item.judul}`
                }
                className="absolute inset-0 overflow-hidden rounded-xl bg-[#0b1622] shadow-[0_40px_90px_-30px_rgba(0,0,0,.9)] transition-[transform,filter,opacity] duration-700 ease-[cubic-bezier(.22,.61,.36,1)]"
                style={{
                  transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
                  filter: `blur(${blur}px)`,
                  opacity,
                  zIndex,
                  pointerEvents: aktifSekarang ? "auto" : "none",
                }}
              >
                {item.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.fotoUrl}
                    alt={item.judul}
                    loading={aktifSekarang ? "eager" : "lazy"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#102b46] to-[#25283b] text-xs uppercase tracking-[.2em] text-white/50">
                    Tanpa foto
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="mx-auto mt-10 w-full max-w-[860px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-[#d8a4b8]">
            {aktif.unitKerja}
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-white sm:text-4xl">
            {aktif.judul}
          </h2>
          <p className="mt-2 text-sm text-white/55">{formatTanggal(aktif.tanggal)}</p>

          {aktif.keterangan ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/70">
              {aktif.keterangan}
            </p>
          ) : null}

          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => geser(-1)}
              aria-label="Kegiatan sebelumnya"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/40 hover:text-white"
            >
              <ArrowLeft size={17} />
            </button>

            <button
              type="button"
              onClick={() => onPilih(index)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#102b46] transition hover:bg-[#f7e6ec]"
            >
              <Maximize2 size={15} /> Lihat foto
            </button>

            <button
              type="button"
              onClick={() => geser(1)}
              aria-label="Kegiatan berikutnya"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/40 hover:text-white"
            >
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Pilih kegiatan">
            {kegiatan.map((item, posisi) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={posisi === index}
                aria-label={item.judul}
                onClick={() => setIndex(posisi)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  posisi === index ? "w-8 bg-[#d8a4b8]" : "w-1.5 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          <p className="mt-4 text-xs text-white/35">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} kegiatan
          </p>
        </div>
      </div>
    </section>
  )
}
