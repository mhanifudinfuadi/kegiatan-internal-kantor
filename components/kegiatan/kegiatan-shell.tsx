"use client"

import { useCallback, useState } from "react"
import HeroStack from "@/components/kegiatan/hero-stack"
import DaftarKegiatan from "@/components/kegiatan/daftar-kegiatan"
import Lightbox from "@/components/kegiatan/lightbox"
import type { Kegiatan } from "@/lib/types"

type Props = {
  kegiatan: Kegiatan[]
}

/**
 * Pembungkus klien yang menyatukan panggung foto, daftar kegiatan, dan
 * lightbox agar ketiganya berbagi state foto yang sedang dibuka.
 */
export default function KegiatanShell({ kegiatan }: Props) {
  const [indexTerbuka, setIndexTerbuka] = useState<number | null>(null)

  const buka = useCallback((index: number) => {
    setIndexTerbuka(index)
  }, [])

  const tutup = useCallback(() => {
    setIndexTerbuka(null)
  }, [])

  return (
    <>
      <HeroStack kegiatan={kegiatan} onPilih={buka} />
      <DaftarKegiatan kegiatan={kegiatan} onPilih={buka} />
      <Lightbox
        kegiatan={kegiatan}
        index={indexTerbuka}
        onPilih={buka}
        onTutup={tutup}
      />
    </>
  )
}
