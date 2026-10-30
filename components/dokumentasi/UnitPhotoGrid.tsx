"use client";

import { useState } from "react";
import PreviewLightbox, { PreviewPhotoItem } from "./PreviewLightbox";
import styles from "./DokumentasiUnit.module.css";

type PhotoData = {
  src: string;
  title: string;
  unit: string;
  date: string;
  isFirstHero?: boolean;
  total: number;
  overallIndex: number;
};

type Props = {
  photos: PhotoData[];
  itemJudul: string;
};

export default function UnitPhotoGrid({ photos, itemJudul }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxItems: PreviewPhotoItem[] = photos.map((p, idx) => ({
    src: p.src,
    title: p.title,
    unit: p.unit,
    date: p.date,
    index: idx,
    total: photos.length,
  }));

  return (
    <>
      <div
        className={`${styles.photoGrid} ${
          photos.length === 1
            ? styles.photoGridSingle
            : photos.length === 2
            ? styles.photoGridTwo
            : photos.length === 3
            ? styles.photoGridThree
            : styles.photoGridMany
        }`}
      >
        {photos.map((photo, idx) => {
          return (
            <figure
              key={`${photo.src}-${idx}`}
              className={`${styles.photoCard} ${
                photos.length === 1
                  ? styles.photoCardLarge
                  : photo.isFirstHero
                  ? styles.photoCardHero
                  : ""
              }`}
              onClick={() => setLightboxIndex(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setLightboxIndex(idx);
                }
              }}
              aria-label={`Buka preview foto ${idx + 1} dari ${photos.length}`}
              title="Klik untuk membuka preview & unduh foto"
            >
              <img
                src={photo.src}
                alt={`${itemJudul} - foto ${idx + 1} dari ${photos.length}`}
                loading="lazy"
                decoding="async"
              />
              <div className={styles.photoOverlayBadge}>
                <span className={styles.photoZoomIcon} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </span>
                <span>Preview / Unduh</span>
              </div>
              {photos.length > 1 && (
                <span className={styles.photoIndexBadge} aria-label={`Foto ${idx + 1} dari ${photos.length}`}>
                  {idx + 1} / {photos.length}
                </span>
              )}
            </figure>
          );
        })}
      </div>

      <PreviewLightbox
        items={lightboxItems}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(nextIdx) => setLightboxIndex(nextIdx)}
      />
    </>
  );
}
