"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

/**
 * Landing hero "White Hood Blossoms".
 *
 * Layer (design.md bagian 3):
 *   0. Video fullscreen (loop 1:1, muted, autoplay, poster webp)
 *   1. Tint radial lembut (#2A2B24, 0% pusat -> 35% tepi)
 *   2. Headline dua baris (sans-serif + script)
 *   3. CTA tunggal "Let's Talks"
 *
 * Motion:
 *   - Masuk: baris 1 fade+translateY 900ms delay 300ms; baris 2 clip-path
 *     reveal 1200ms delay 550ms; CTA fade+scale 700ms delay 900ms.
 *   - Keluar (klik CTA): teks fade 400ms; video scale 1 -> 1.06 & overlay
 *     gelap 800ms; total 1000ms lalu pindah ke /dokumentasi.
 *   - prefers-reduced-motion: video dipause, poster statis, tanpa animasi.
 */

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)"
const EASE_TRANSISI = "cubic-bezier(0.65, 0, 0.35, 1)"

export default function LandingHero() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [siap, setSiap] = useState(false)
  const [bertransisi, setBertransisi] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Tandai "siap" saat video bisa diputar -> memicu animasi masuk.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const setSiapTrue = () => setSiap(true)

    if (video.readyState >= 3) {
      setSiapTrue()
    } else {
      video.addEventListener("canplay", setSiapTrue)
      video.addEventListener("loadeddata", setSiapTrue)
    }

    if (reduced) {
      video.pause()
      setSiap(true) // poster tampil, tanpa animasi (CSS mematikan animasi)
    }

    return () => {
      video.removeEventListener("canplay", setSiapTrue)
      video.removeEventListener("loadeddata", setSiapTrue)
    }
  }, [])

  // Auto-hide fallback poster setelah 2.2 detik walau event tidak terpicu.
  useEffect(() => {
    const t = setTimeout(() => setSiap(true), 2200)
    return () => clearTimeout(t)
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const klikCta = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (bertransisi) {
        event.preventDefault()
        return
      }
      setBertransisi(true)

      const mulaiViewTransition = () => {
        // View Transitions API (Chrome/Edge): browser membatasi animasi sendiri.
        const doc = document as Document & {
          startViewTransition?: (cb: () => void) => { finished: Promise<void> }
        }
        if (doc.startViewTransition) {
          doc.startViewTransition(() => {
            router.push("/dokumentasi")
          })
        } else {
          // Fallback: pindah setelah animasi keluar 1000ms selesai.
          timerRef.current = setTimeout(() => router.push("/dokumentasi"), 1000)
        }
      }

      mulaiViewTransition()
    },
    [bertransisi, router],
  )

  const kelasAnimasi = siap && !bertransisi

  return (
    <main
      ref={rootRef}
      className={`hero-root relative h-[100svh] w-full overflow-hidden bg-[#1a1b16] ${bertransisi ? "hero-keluar" : ""}`}
    >
      {/* Layer 0 — video latar */}
      <video
        ref={videoRef}
        className="hero-video"
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/assets/hero/white-hood-blossoms.webp"
      >
        <source src="/assets/hero/white-hood-blossoms.mp4" type="video/mp4" />
      </video>

      {/* Layer 1 — tint radial */}
      <div className="hero-tint" aria-hidden="true" />

      {/* Layer 2 + 3 — konten */}
      <div
        className={`hero-konten ${kelasAnimasi ? "hero-animasi-masuk" : ""}`}
      >
        <h1 className="hero-headline">
          <span className="hero-baris1">Dokumentasi yang</span>
          <span className="hero-baris2">Menyimpan momen</span>
        </h1>

        <Link
          href="/dokumentasi"
          onClick={klikCta}
          className="hero-cta"
          aria-label="Go to the room"
        >
          <span className="hero-cta-label">Go to the room</span>
          <span className="hero-cta-ikon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="hero-cta-panah"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </Link>
      </div>
    </main>
  )
}
