"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./DokumentasiIndex.module.css";

type StoryPhoto = {
  src: string;
  judul: string;
  tanggal: string | null;
};

type Props = {
  href: string;
  nama: string;
  index: number;
  photos: StoryPhoto[];
  kegiatanCount: number;
  latestTanggal: string | null;
  latestJudul: string | null;
};

function formatTanggal(value: string | null) {
  if (!value) return "Tanggal belum dicatat";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Tanggal belum dicatat";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const INTERVAL_MS = 3800;

export default function StoryCard({
  href,
  nama,
  index,
  photos,
  kegiatanCount,
  latestTanggal,
  latestJudul,
}: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = photos.length;
  const safeActive = total > 0 ? active % total : 0;

  const shellRef = useRef<HTMLAnchorElement | null>(null);
  const visibleRef = useRef(true);

  // Gulir bergilir: tampilkan foto-foto kegiatan dari unit ini satu per satu.
  useEffect(() => {
    if (total <= 1 || paused) return;
    const timer = window.setInterval(() => {
      if (!visibleRef.current) return;
      if (document.visibilityState === "hidden") return;
      setActive((prev) => (prev + 1) % total);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  // Hentikan putaran saat kartu tidak terlihat di layar (hemat bandwidth).
  useEffect(() => {
    const node = shellRef.current?.querySelector('[class*="cover"]') as HTMLElement | null;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const go = useCallback(
    (next: number) => {
      if (total <= 0) return;
      setActive(((next % total) + total) % total);
    },
    [total],
  );

  return (
    <Link
      ref={shellRef}
      href={href}
      className={styles.unitCard}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.cover}>
        {total > 0 ? (
          <div className={styles.coverSlider} aria-hidden="true">
            {photos.map((photo, idx) => (
              <img
                key={`${photo.src}-${idx}`}
                src={photo.src}
                alt=""
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                className={`${styles.coverImage} ${idx === safeActive ? styles.coverImageActive : ""}`}
              />
            ))}
          </div>
        ) : (
          <div className={styles.coverEmpty}>
            <span aria-hidden="true">✿</span>
            <span>Belum ada foto</span>
          </div>
        )}
        <span className={styles.coverShade} aria-hidden="true" />
        <span className={styles.unitNo}>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.coverTag}>{kegiatanCount} KEGIATAN · {total} FOTO</span>
        <span className={styles.cardArrow} aria-hidden="true">
          ↗
        </span>

        {total > 1 && (
          <div className={styles.coverControls}>
            <button
              type="button"
              className={styles.coverNav}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(safeActive - 1);
              }}
              aria-label={`Foto sebelumnya dari ${nama}`}
            >
              ‹
            </button>
            <div className={styles.coverDots} role="tablist" aria-label={`Foto ${nama}`}>
              {photos.map((photo, idx) => (
                <button
                  key={`${photo.src}-dot-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={idx === safeActive}
                  aria-label={`Foto ${idx + 1} dari ${total}`}
                  className={`${styles.coverDot} ${idx === safeActive ? styles.coverDotActive : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go(idx);
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              className={styles.coverNav}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(safeActive + 1);
              }}
              aria-label={`Foto berikutnya dari ${nama}`}
            >
              ›
            </button>
          </div>
        )}

        {photos[safeActive] && (
          <span className={styles.coverCaption}>
            <em>{photos[safeActive].judul}</em>
            <span className={styles.coverCounter}>
              {String(safeActive + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
            </span>
          </span>
        )}
      </div>

      <div className={styles.unitInfo}>
        <span className={styles.unitKicker}>
          RAGAM CERITA <span>· 物語 {String(index + 1).padStart(2, "0")}</span>
        </span>
        <h3>{nama}</h3>
        <p className={styles.latestDate}>{formatTanggal(latestTanggal)}</p>
        <div className={styles.latestLine}>
          <span>Kegiatan terbaru</span>
          <strong>{latestJudul ?? "Belum ada kegiatan"}</strong>
        </div>
      </div>
    </Link>
  );
}
