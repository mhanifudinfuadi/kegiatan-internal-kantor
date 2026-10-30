"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./PreviewLightbox.module.css";

export type PreviewPhotoItem = {
  src: string;
  title: string;
  unit: string;
  date: string;
  index: number;
  total: number;
};

type Props = {
  items: PreviewPhotoItem[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
};

export default function PreviewLightbox({ items, currentIndex, onClose, onNavigate }: Props) {
  const [downloading, setDownloading] = useState(false);

  const active = currentIndex !== null && items[currentIndex] ? items[currentIndex] : null;

  const handleNext = useCallback(() => {
    if (currentIndex === null || items.length <= 1) return;
    onNavigate((currentIndex + 1) % items.length);
  }, [currentIndex, items.length, onNavigate]);

  const handlePrev = useCallback(() => {
    if (currentIndex === null || items.length <= 1) return;
    onNavigate((currentIndex - 1 + items.length) % items.length);
  }, [currentIndex, items.length, onNavigate]);

  // Keyboard navigation (Esc, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [active, handleNext, handlePrev, onClose]);

  // Download handler
  const handleDownload = async () => {
    if (!active || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(active.src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;

      // Extract filename from URL or make a clean one
      let filename = `dokumentasi-${active.unit.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${active.index + 1}.jpg`;
      try {
        const urlParts = active.src.split("/").pop();
        if (urlParts && urlParts.includes(".")) {
          filename = urlParts.split("?")[0];
        }
      } catch {}

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: buka di tab baru jika CORS membatasi fetch blob
      window.open(active.src, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  if (!active || currentIndex === null) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${active.title}`}
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header className={styles.topbar}>
        <div className={styles.counter}>
          <span className={styles.counterMonogatari}>
            <span className={styles.monogatariMark} aria-hidden="true">物語</span>
            <span>RAGAM CERITA · {active.unit}</span>
          </span>
          <span className={styles.counterIndex}>
            写真 {currentIndex + 1} / {items.length}
          </span>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className={styles.btnAction}
            aria-label="Unduh foto"
            title="Unduh foto beresolusi penuh"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{downloading ? "Mengunduh..." : "Unduh Foto"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className={styles.btnClose}
            aria-label="Tutup preview"
            title="Tutup (Esc)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      <div className={styles.stage}>
        {items.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className={`${styles.navBtn} ${styles.navPrev}`}
            aria-label="Foto sebelumnya"
            title="Foto sebelumnya (Panah Kiri)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <figure className={styles.figure}>
          <div className={styles.imageWrap}>
            <img
              src={active.src}
              alt={active.title}
              className={styles.image}
              decoding="async"
            />
          </div>

          <figcaption className={styles.caption}>
            <h2 className={styles.captionTitle}>{active.title}</h2>
            <p className={styles.captionMeta}>
              <span className={styles.captionJp} aria-hidden="true">活動物語 ·</span>
              {active.unit} {active.date ? `· ${active.date}` : ""}
            </p>
          </figcaption>
        </figure>

        {items.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className={`${styles.navBtn} ${styles.navNext}`}
            aria-label="Foto berikutnya"
            title="Foto berikutnya (Panah Kanan)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {items.length > 1 && (
        <div className={styles.thumbnails} aria-label="Daftar foto kegiatan">
          {items.map((item, idx) => (
            <button
              key={`${item.src}-${idx}`}
              type="button"
              onClick={() => onNavigate(idx)}
              className={`${styles.thumbBtn} ${idx === currentIndex ? styles.thumbActive : ""}`}
              aria-label={`Pilih foto ${idx + 1}`}
              aria-current={idx === currentIndex ? "true" : undefined}
            >
              <img src={item.src} alt="" className={styles.thumbImg} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
