"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Images, Search, X } from "lucide-react"
import type { Kegiatan } from "@/lib/types"

type Props = {
  kegiatan: Kegiatan[]
  onPilih: (index: number) => void
}

function formatTanggal(value: string | null) {
  if (!value) return null
  const tanggal = new Date(value)
  if (Number.isNaN(tanggal.getTime())) return null
  return {
    hari: tanggal.toLocaleDateString("id-ID", { day: "2-digit" }),
    bulan: tanggal.toLocaleDateString("id-ID", { month: "short" }),
    tahun: tanggal.getFullYear(),
    lengkap: tanggal.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  }
}

export default function DaftarKegiatan({ kegiatan, onPilih }: Props) {
  const [cari, setCari] = useState("")
  const [unitAktif, setUnitAktif] = useState<string>("semua")
  const [tahunAktif, setTahunAktif] = useState<string>("semua")

  const tahunTersedia = useMemo(() => {
    const set = new Set<number>()
    for (const item of kegiatan) {
      const tanggal = formatTanggal(item.tanggal)
      if (tanggal) set.add(tanggal.tahun)
    }
    return Array.from(set).sort((a, b) => b - a)
  }, [kegiatan])

  const hasil = useMemo(() => {
    const kata = cari.trim().toLowerCase()
    return kegiatan.filter((item) => {
      if (unitAktif !== "semua" && item.unitKerjaSlug !== unitAktif) return false
      const tanggal = formatTanggal(item.tanggal)
      if (tahunAktif !== "semua" && String(tanggal?.tahun ?? "") !== tahunAktif) return false
      if (!kata) return true
      return (
        item.judul.toLowerCase().includes(kata) ||
        (item.keterangan ?? "").toLowerCase().includes(kata) ||
        item.unitKerja.toLowerCase().includes(kata)
      )
    })
  }, [kegiatan, cari, unitAktif, tahunAktif])

  const jumlahPerUnit = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of hasil) {
      map.set(item.unitKerjaSlug, (map.get(item.unitKerjaSlug) ?? 0) + 1)
    }
    return map
  }, [hasil])

  const unitTampil = useMemo(() => {
    const namaUnit = new Map<string, string>()
    for (const item of kegiatan) {
      if (!namaUnit.has(item.unitKerjaSlug)) {
        namaUnit.set(item.unitKerjaSlug, item.unitKerja)
      }
    }

    return Array.from(namaUnit.entries())
      .map(([slug, nama]) => ({
        slug,
        nama,
        jumlah: jumlahPerUnit.get(slug) ?? 0,
      }))
      .filter((unit) => unit.jumlah > 0)
  }, [kegiatan, jumlahPerUnit])

  const adaFilter = cari.trim() !== "" || unitAktif !== "semua" || tahunAktif !== "semua"

  return (
    <section id="daftar-kegiatan" className="scroll-mt-24 bg-[#fbfaf9] px-4 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-[#B66B87]">
            Arsip kegiatan
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-[#102b46] sm:text-5xl">
            Daftar kegiatan unit kerja
          </h2>
          <p className="mt-4 text-base leading-7 text-[#4b5265]">
            Rekap kegiatan internal kantor yang diunggah melalui portal admin.
            Pilih unit kerja atau gunakan pencarian untuk menemukan kegiatan tertentu.
          </p>
        </header>

        <div className="sticky top-16 z-30 -mx-4 mt-10 border-y border-[#e9e4e1] bg-[#fbfaf9]/92 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative flex min-w-[240px] flex-1 items-center">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 text-[#8a8f9d]"
                />
                <input
                  value={cari}
                  onChange={(event) => setCari(event.target.value)}
                  placeholder="Cari judul, keterangan, atau unit kerja"
                  aria-label="Cari kegiatan"
                  className="w-full rounded-full border border-[#e2ddd9] bg-white py-2.5 pl-10 pr-4 text-sm text-[#25283b] outline-none transition placeholder:text-[#a6abb6] focus:border-[#B66B87] focus:ring-2 focus:ring-[#f6dfe7]"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-[#4b5265]">
                <CalendarDays size={15} className="text-[#8a8f9d]" />
                <span className="sr-only sm:not-sr-only">Tahun</span>
                <select
                  value={tahunAktif}
                  onChange={(event) => setTahunAktif(event.target.value)}
                  aria-label="Filter tahun"
                  className="rounded-full border border-[#e2ddd9] bg-white px-4 py-2.5 text-sm text-[#25283b] outline-none transition focus:border-[#B66B87] focus:ring-2 focus:ring-[#f6dfe7]"
                >
                  <option value="semua">Semua tahun</option>
                  {tahunTersedia.map((tahun) => (
                    <option key={tahun} value={tahun}>
                      {tahun}
                    </option>
                  ))}
                </select>
              </label>

              {adaFilter ? (
                <button
                  type="button"
                  onClick={() => {
                    setCari("")
                    setUnitAktif("semua")
                    setTahunAktif("semua")
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e2ddd9] bg-white px-4 py-2.5 text-sm font-medium text-[#4b5265] transition hover:border-[#B66B87] hover:text-[#9d5672]"
                >
                  <X size={14} /> Reset
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setUnitAktif("semua")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  unitAktif === "semua"
                    ? "bg-[#102b46] text-white"
                    : "border border-[#e2ddd9] bg-white text-[#4b5265] hover:border-[#B66B87] hover:text-[#9d5672]"
                }`}
              >
                Semua unit
                <span className="ml-2 text-xs opacity-70">{hasil.length}</span>
              </button>

              {unitTampil.map((unit) => (
                <button
                  key={unit.slug}
                  type="button"
                  onClick={() => setUnitAktif(unit.slug)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    unitAktif === unit.slug
                      ? "bg-[#102b46] text-white"
                      : "border border-[#e2ddd9] bg-white text-[#4b5265] hover:border-[#B66B87] hover:text-[#9d5672]"
                  }`}
                >
                  {unit.nama}
                  <span className="ml-2 text-xs opacity-70">{unit.jumlah}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {hasil.length === 0 ? (
          <div className="mt-14 flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#e2ddd9] bg-white px-6 py-20 text-center">
            <Images size={34} className="text-[#d8a4b8]" />
            {kegiatan.length === 0 ? (
              <>
                <p className="mt-4 font-display text-2xl text-[#102b46]">
                  Belum ada kegiatan yang diunggah
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#6b7180]">
                  Dokumentasi kegiatan akan muncul di sini setelah admin mengunggahnya lewat
                  portal admin.
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 font-display text-2xl text-[#102b46]">
                  Tidak ada kegiatan ditemukan
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#6b7180]">
                  Coba kata kunci lain, atau pilih unit kerja dan tahun yang berbeda.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="mt-14 space-y-16">
            {unitTampil.map((unit) => {
              const daftar = hasil.filter((item) => item.unitKerjaSlug === unit.slug)
              if (daftar.length === 0) return null

              return (
                <article key={unit.slug}>
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e9e4e1] pb-4">
                    <div>
                      <h3 className="font-display text-2xl text-[#102b46] sm:text-3xl">
                        {unit.nama}
                      </h3>
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#B66B87]">
                      {daftar.length} kegiatan
                    </p>
                  </div>

                  <ul className="mt-2 divide-y divide-[#ece8e5]">
                    {daftar.map((item) => {
                      const index = kegiatan.findIndex((kandidat) => kandidat.id === item.id)
                      const tanggal = formatTanggal(item.tanggal)

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => onPilih(index)}
                            className="group grid w-full grid-cols-[auto_1fr] items-start gap-4 py-6 text-left transition sm:grid-cols-[auto_minmax(0,1fr)_200px] sm:gap-6"
                          >
                            <span className="flex w-14 flex-col items-center rounded-xl border border-[#e9e4e1] bg-white py-2 text-center">
                              <span className="font-display text-xl leading-none text-[#102b46]">
                                {tanggal ? tanggal.hari : "--"}
                              </span>
                              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-[#B66B87]">
                                {tanggal ? tanggal.bulan : "—"}
                              </span>
                              <span className="text-[10px] text-[#a6abb6]">
                                {tanggal ? tanggal.tahun : ""}
                              </span>
                            </span>

                            <span className="min-w-0">
                              <span className="block text-[11px] font-semibold uppercase tracking-[.2em] text-[#9d5672]">
                                {item.unitKerja}
                              </span>
                              <span className="mt-2 block font-display text-xl leading-snug text-[#1b2b3d] transition group-hover:text-[#9d5672] sm:text-2xl">
                                {item.judul}
                              </span>
                              {item.keterangan ? (
                                <span className="mt-2 block line-clamp-2 text-sm leading-6 text-[#6b7180]">
                                  {item.keterangan}
                                </span>
                              ) : null}
                            </span>

                            <span className="col-span-2 mt-2 overflow-hidden rounded-xl border border-[#e9e4e1] bg-[#f3f1ef] sm:col-span-1 sm:mt-0">
                              {item.fotoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.fotoUrl}
                                  alt={item.judul}
                                  loading="lazy"
                                  className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                                />
                              ) : (
                                <span className="flex aspect-[16/10] w-full items-center justify-center text-[10px] uppercase tracking-[.18em] text-[#a6abb6]">
                                  Tanpa foto
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
